import {pool} from "../config/pool.js";
import jwt from "jsonwebtoken";
import {invalidCategory, invalidEmail, invalidID, invalidLogin, invalidType, missingInfo, serverError, transactionNotFound, unauthorized, userExists} from "../utils/messages.js"
import { verifyEmail, verifyItens, verifyIdFromParams } from "../utils/verifications.js";
import dotenv from "dotenv";
import { hashPassword, validPassword } from "../utils/utils.js";

const getCategories = async (req, res) => {
    try {

        const query = "select * from categorias";

        const {rows} = await pool.query(query);

        return res.status(200).json(rows);

        
    } catch (error) {
        console.log(error.message);
        return res.status(403).json({mensagem: unauthorized});        
    }
}

const getTransactions = async (req, res) => {
    const userId = req.user.id;
    const { filtro } = req.query;
    try {
        let query = `select t.*, c.descricao as categoria_nome from transacoes t 
        inner join categorias c on t.categoria_id = c.id where t.usuario_id = $1`;
        let values = [userId];


        if (filtro && Array.isArray(filtro) && filtro.length > 0) {
            query += ` and c.descricao ilike any($2::text[])`;
            values.push(filtro);
        }

        console.log(filtro)
        
        const {rows} = await pool.query(query, values);

        const result = rows.map((row) => {
            return {
                id: row.id,
                tipo: row.tipo,
                descricao: row.descricao,
                valor: row.valor,
                data: row.data,
                usuario_id: row.usuario_id,
                categoria_id: row.categoria_id,
                categoria_nome: row.categoria_nome
            };
        });

        return res.status(200).json(result);

        
    } catch (error) {
        console.log(error.message);
        return res.status(403).json({mensagem: unauthorized});        
    }
}

const getTransactionById = async (req, res) => {
    const transactionId = Number(req.params.id);
    const userID = req.user.id;

    try {
        if(!verifyIdFromParams(transactionId)) {
            return res.status(400).json({mensagem: invalidID});
        }

    const query = `select t.*, c.descricao as categoria_nome from transacoes t 
    inner join categorias c on t.categoria_id = c.id where t.id = $1 and t.usuario_id = $2`;
    const {rows} = await pool.query(query, [transactionId, userID]);

    if(rows.length < 1) {
        return res.status(404).json({mensagem: transactionNotFound});
    }

    const result = {
        id: rows[0].id,
        tipo: rows[0].tipo,
        descricao: rows[0].descricao,
        valor: rows[0].valor,
        data: rows[0].data,
        usuario_id: rows[0].usuario_id,
        categoria_id: rows[0].categoria_id,
        categoria_nome: rows[0].categoria_nome
    }

        return res.status(200).json(result);

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({mensagem: serverError});
        
    }
    
}

const addTransaction = async (req, res) => {
    const {descricao, valor, data, categoria_id, tipo} = req.body;
    const userID = req.user.id;

    if (verifyItens(descricao) || verifyItens(valor) || verifyItens(data) || verifyItens(categoria_id) ||verifyItens(tipo)) {
        return res.status(400).json({ mensagem: missingInfo});
    }

    if (tipo !== "entrada" && tipo !== "saida") {
        return res.status(400).json({ mensagem: invalidType});
    }

    try {

        const insertQuery = `insert into transacoes (descricao, valor, data, categoria_id, usuario_id, tipo)
        values ($1, $2, $3, $4, $5, $6) returning *`;
        const insertValues = [descricao, valor, data, categoria_id, userID, tipo];

        const {rows: insertRow} = await pool.query(insertQuery, insertValues);

        const categoryQuery = `select descricao from categorias where id = $1`;
        const categoryValues = [insertRow[0].categoria_id];

        const {rows: categoryRow} = await pool.query(categoryQuery, categoryValues);

        const result = {
            id: insertRow[0].id,
            tipo: insertRow[0].tipo,
            descricao: insertRow[0].descricao,
            valor: insertRow[0].valor,
            data: insertRow[0].data,
            usuario_id: insertRow[0].usuario_id,
            categoria_id: insertRow[0].categoria_id,
            categoria_nome: categoryRow[0].descricao
        }
        return res.status(201).json(result);
        
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({mensagem: serverError});        
    }

}

const updateTransaction = async (req, res) => {
    const user_id = req.user.id; 
    const transactionId = Number(req.params.id);
    const { descricao, valor, data, categoria_id, tipo } = req.body;

    if (!verifyIdFromParams(transactionId)) {
        return res.status(400).json({ mensagem: invalidID });
    }

    if (!descricao || !valor || !data || !categoria_id || !tipo) {
        return res.status(400).json({ mensagem: missingInfo });
    }

    if (tipo !== "entrada" && tipo !== "saida") {
        return res.status(400).json({ mensagem: invalidType });
    }

    try {
        // Verifique se a transação pertence ao usuário logado
        const transactionQuery = `select id from transacoes where id = $1 and usuario_id = $2;`;
        const transactionValues = [transactionId, user_id];

        const { rows: transactionRows } = await pool.query(transactionQuery, transactionValues);

        if (transactionRows.length < 1) {
            return res.status(403).json({ mensagem: unauthorized });
        }

        // Verifique se a categoria existe
        const categoryQuery = `select id from categorias where id = $1;`;
        const categoryValues = [categoria_id];

        const { rows: categoryRows } = await pool.query(categoryQuery, categoryValues);

        if (categoryRows.length === 0) {
            return res.status(400).json({ mensagem: invalidCategory });
        }

        // Atualize a transação no banco de dados
        const updateQuery = `update transacoes set 
        descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5
        where id = $6;`;

        const updateValues = [descricao, valor, data, categoria_id, tipo, transactionId];

        await pool.query(updateQuery, updateValues);

        return res.status(204).send();

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ mensagem: serverError });
    }
}

const deleteTransaction = async (req, res) => {
    const transactionId = Number(req.params.id);
    const userID = req.user.id;

    try {
        if(!verifyIdFromParams(transactionId)) {
            return res.status(400).json({mensagem: invalidID});
        }

    const searchQuery = `select * from transacoes where id = $1 and usuario_id = $2`;
    const {rows} = await pool.query(searchQuery,[transactionId, userID]);

    if(rows.length < 1) {
        return res.status(404).json({mensagem: transactionNotFound});
    }

    const deletedQuery = `delete from transacoes where id = $1 and usuario_id = $2`;
    await pool.query(deletedQuery, [transactionId, userID]);

        return res.status(204).json();

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({mensagem: serverError});
    }
    
}

const transactionsExtract = async(req, res) => {
    const userId = req.user.id;
    let inflow = 0;
    let outflow = 0;

    try {

        //Somando as entradas
        const inflowQuery = `select sum(valor) as entrada from transacoes
        where usuario_id = $1 and tipo = 'entrada'`;
        const inflowValues = [userId];
        const {rows: inflowRows} = await pool.query(inflowQuery, inflowValues);
        if (inflowRows < 1) {
            inflow = 0
        } else {
            inflow = Number(inflowRows[0].entrada);
        }

        //Somando as saídas
        const outflowQuery = `select sum(valor) as saida from transacoes
        where usuario_id = $1 and tipo = 'saida'`;
        const outflowValues = [userId];
        const {rows: outflowRows} = await pool.query(outflowQuery, outflowValues);
        if (outflowRows < 1) {
            outflow = 0
        } else {
            outflow = Number(outflowRows[0].saida);
        }

        const result = {
            entrada: inflow,
            saída: outflow,
            saldo: inflow - outflow
        }

        return res.status(200).json(result);


        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({mensagem: serverError});
    }

}


export {getCategories, getTransactions, getTransactionById, 
    addTransaction, updateTransaction, deleteTransaction,
transactionsExtract};