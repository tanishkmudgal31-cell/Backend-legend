const mongoose = require("mongoose");

const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const blacklistModel = require("../models/blacklist.model");
const emailService = require("../services/email.service");


async function createTransaction(req, res) {
  let session;

  try {
    /*
     * 1. Validate request
     */

    const {
      fromAccount,
      toAccount,
      amount,
      idempotentKey,
      description,
    } = req.body;

    if (
      !fromAccount ||
      !toAccount ||
      amount === undefined ||
      amount === null ||
      !idempotentKey
    ) {
      return res.status(400).json({
        message:
          "fromAccount, toAccount, amount and idempotentKey are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({
        message: "Cannot transfer money to the same account",
      });
    }

    /*
     * 2. Validate MongoDB account IDs
     */

    if (
      !mongoose.Types.ObjectId.isValid(fromAccount) ||
      !mongoose.Types.ObjectId.isValid(toAccount)
    ) {
      return res.status(400).json({
        message: "Invalid account ID",
      });
    }

    /*
     * 3. Check whether this transaction was already processed
     */

    const existingTransaction =
      await transactionModel.findOne({
        idempotentKey,
      });

    if (existingTransaction) {
      if (existingTransaction.status === "COMPLETED") {
        return res.status(200).json({
          message: "Transaction already processed",
          transaction: existingTransaction,
        });
      }

      if (existingTransaction.status === "PENDING") {
        return res.status(409).json({
          message: "Transaction is still processing",
        });
      }

      if (existingTransaction.status === "FAILED") {
        return res.status(409).json({
          message: "Transaction processing failed previously",
          transaction: existingTransaction,
        });
      }

      if (existingTransaction.status === "REVERSED") {
        return res.status(409).json({
          message: "Transaction was reversed",
          transaction: existingTransaction,
        });
      }
    }

    /*
     * 4. Start MongoDB session
     */

    session = await mongoose.startSession();


    /*
     * 5. Execute the complete money transfer
     *
     * withTransaction automatically handles commit,
     * rollback and retrying certain transient errors.
     */

    let completedTransaction;

    await session.withTransaction(async () => {

      /*
       * 5A. Find sender account
       */

      const fromUserAccount = await accountModel
        .findOne({
          _id: fromAccount,
        })
        .session(session);


      /*
       * 5B. Find receiver account
       */

      const toUserAccount = await accountModel
        .findOne({
          _id: toAccount,
        })
        .session(session);


      /*
       * 5C. Check accounts exist
       */

      if (!fromUserAccount) {
        throw new Error("Sender account not found");
      }

      if (!toUserAccount) {
        throw new Error("Receiver account not found");
      }


      /*
       * 5D. Check sender owns the account
       */

      if (
        fromUserAccount.user.toString() !==
        req.user._id.toString()
      ) {
        const error = new Error(
          "You are not authorized to transfer money from this account"
        );

        error.statusCode = 403;

        throw error;
      }


      /*
       * 5E. Check account status
       *
       * Your account model uses "Active".
       */

      if (fromUserAccount.status !== "Active") {
        const error = new Error(
          "Sender account is not active"
        );

        error.statusCode = 400;

        throw error;
      }

      if (toUserAccount.status !== "Active") {
        const error = new Error(
          "Receiver account is not active"
        );

        error.statusCode = 400;

        throw error;
      }


      /*
       * 5F. Check blacklist
       */

      const blacklistedAccount =
        await blacklistModel.findOne({
          account: {
            $in: [
              fromUserAccount._id,
              toUserAccount._id,
            ],
          },
          status: "ACTIVE",
        }).session(session);


      if (blacklistedAccount) {
        const error = new Error(
          "Transaction blocked because an account is blacklisted"
        );

        error.statusCode = 403;

        throw error;
      }


      /*
       * 5G. Get sender balance from ledger
       */

      const balance =
        await fromUserAccount.getBalance(session);


      /*
       * 5H. Check sufficient balance
       */

      if (balance < numericAmount) {
        const error = new Error(
          "Insufficient balance"
        );

        error.statusCode = 400;

        throw error;
      }


      /*
       * 5I. Create transaction
       */

      let transaction;

      try {
        transaction = await transactionModel.create(
          [
            {
              type: "TRANSFER",

              amount: numericAmount,

              fromAccount:
                fromUserAccount._id,

              toAccount:
                toUserAccount._id,

              idempotentKey,

              description,

              status: "PENDING",

              reference:
                `TXN-${new mongoose.Types.ObjectId().toString()}`,
            },
          ],
          {
            session,
          }
        );
      } catch (error) {

        /*
         * Another request may have created the same
         * idempotentKey at the same time.
         */

        if (error.code === 11000) {
          const duplicateTransaction =
            await transactionModel.findOne({
              idempotentKey,
            }).session(session);

          if (duplicateTransaction) {
            completedTransaction =
              duplicateTransaction;

            return;
          }
        }

        throw error;
      }


      /*
       * Get transaction document
       */

      const transactionDocument =
        transaction[0];

      const transactionId =
        transactionDocument._id;


      /*
       * 5J. Create DEBIT ledger entry
       */

      await ledgerModel.create(
        [
          {
            account:
              fromUserAccount._id,

            amount:
              numericAmount,

            transaction:
              transactionId,

            type: "DEBIT",
          },
        ],
        {
          session,
        }
      );


      /*
       * 5K. Create CREDIT ledger entry
       */

      await ledgerModel.create(
        [
          {
            account:
              toUserAccount._id,

            amount:
              numericAmount,

            transaction:
              transactionId,

            type: "CREDIT",
          },
        ],
        {
          session,
        }
      );


      /*
       * 5L. Mark transaction as COMPLETED
       */

      transactionDocument.status =
        "COMPLETED";

      await transactionDocument.save({
        session,
      });


      /*
       * Store completed transaction
       */

      completedTransaction =
        transactionDocument;
    });


    /*
     * 6. Close session
     */

    await session.endSession();
    session = null;


    /*
     * 7. If duplicate request was detected
     */

    if (
      completedTransaction &&
      completedTransaction.status === "COMPLETED"
    ) {

      /*
       * Populate accounts and users for email
       */

      const transactionWithUsers =
        await transactionModel
          .findById(completedTransaction._id)
          .populate({
            path: "fromAccount",
            populate: {
              path: "user",
              select: "name email",
            },
          })
          .populate({
            path: "toAccount",
            populate: {
              path: "user",
              select: "name email",
            },
          });


      /*
       * Send email to sender
       */

      try {
        if (
          transactionWithUsers.fromAccount &&
          transactionWithUsers.fromAccount.user
        ) {
          await emailService.sendTransactionEmail(
            transactionWithUsers.fromAccount.user.email,
            transactionWithUsers.fromAccount.user.name,
            transactionWithUsers.amount,
            transactionWithUsers._id,
            "SENDER"
          );
        }
      } catch (emailError) {
        console.error(
          "Sender transaction email failed:",
          emailError.message
        );
      }


      /*
       * Send email to receiver
       */

      try {
        if (
          transactionWithUsers.toAccount &&
          transactionWithUsers.toAccount.user
        ) {
          await emailService.sendTransactionEmail(
            transactionWithUsers.toAccount.user.email,
            transactionWithUsers.toAccount.user.name,
            transactionWithUsers.amount,
            transactionWithUsers._id,
            "RECEIVER"
          );
        }
      } catch (emailError) {
        console.error(
          "Receiver transaction email failed:",
          emailError.message
        );
      }


      /*
       * Return successful response
       */

      return res.status(201).json({
        message:
          "Transaction completed successfully",

        transaction:
          transactionWithUsers,
      });
    }


  } catch (error) {

    /*
     * Abort transaction if session is still active
     */

    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error(
          "Transaction abort error:",
          abortError.message
        );
      }

      await session.endSession();
    }


    /*
     * Determine proper HTTP status
     */

    let statusCode =
      error.statusCode || 500;


    /*
     * Handle duplicate idempotency key
     */

    if (error.code === 11000) {
      statusCode = 409;
    }


    /*
     * Handle Mongoose validation errors
     */

    if (error.name === "ValidationError") {
      statusCode = 400;
    }


    console.error(
      "Transaction error:",
      error.message
    );


    return res.status(statusCode).json({
      message: error.message,
    });
  }
}


module.exports = {
  createTransaction,
};