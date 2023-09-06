import express from "express";
import {addUser, getUser, login, updateUser} from "../controllers/userController.js"
import {verifyUserLogin} from "../middleware/verifyUserLogin.js";
import{addTransaction, deleteTransaction, getCategories, getTransactionById, getTransactions, transactionsExtract, updateTransaction} from "../controllers/transactionsController.js"

const route = express();

route.post(("/usuario"), addUser);
route.post(("/login"), login);

route.use(verifyUserLogin);

route.get(("/usuario"), getUser);

route.put(("/usuario"), updateUser);

route.get(("/categoria"), getCategories);

route.get(("/transacao"), getTransactions);

route.get(("/transacao/extrato"), transactionsExtract);

route.get(("/transacao/:id"), getTransactionById);

route.post(("/transacao"), addTransaction);

route.put(("/transacao/:id"), updateTransaction);

route.delete(("/transacao/:id"), deleteTransaction);
export {route};