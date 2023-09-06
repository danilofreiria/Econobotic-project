import {pool} from "../config/pool.js";
import jwt from "jsonwebtoken";
import {invalidEmail, invalidLogin, missingInfo, serverError, userExists} from "../utils/messages.js"
import { verifyEmail, verifyItens } from "../utils/verifications.js";
import dotenv from "dotenv";
import { hashPassword, validPassword } from "../utils/utils.js";


dotenv.config();


const addUser = async (req, res) => {
    const {nome, email, senha} = req.body;

    try {

        //Verificando se os campos estão preenchidos
        if (verifyItens(nome) || verifyItens(email) || verifyItens(senha)) {
            return res.status(400).json({ mensagem: missingInfo});
          }

        //fazendo o hash da senha
        const crypt = await hashPassword(senha);
 
        //cadastrando usuário
        const query = `insert into usuarios (nome, email, senha) 
        values ($1, $2, $3) returning *`;
        const values = [nome, email, crypt];
        const {rows} = await pool.query(query, values);

        const newUser = {
            id: rows[0].id,
            nome: rows[0].nome,
            email: rows[0].email
        };

        return res.status(201).json(newUser);

        
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({mensagem: userExists})
        
    }
};

const login = async (req, res) => {

    //pegando do body e validando que há informações
    const {email, senha} = req.body;
    if (verifyItens(email) || verifyItens(senha)) {
        return res.status(400).json({mensagem: missingInfo});
    };

    try {
        //Validando email e senha no banco de dados
        const query = "select * from usuarios where email = $1";
        const values = [email];
        const user = await pool.query(query, values);
        const userPassword = await validPassword(senha, user.rows[0].senha);

        if (user.rowCount < 1 || !userPassword) { 
            return res.status(403).json({ mensagem: invalidLogin });
        }   
        
        //Gerando token
        const key = process.env.jwtPassword;
        const token = jwt.sign({id: user.rows[0].id}, key, {expiresIn: "8h"});

        //Pegando os dados do usuario para retornar
        const {senha: _, ...userInfo} = user.rows[0];

        return res.status(200).json({usuario: userInfo, token});
    } catch (error) {
        console.log(error.message);
        //quando o email não é encontrado
        return res.status(403).json({mensagem: invalidLogin});
        
    }
}


const getUser = async (req, res) => {
  try {
      //pegando as informações do req.user do mid
      const {id, nome, email} = req.user

      res.status(200).json({id, nome, email});
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({mensagem: serverError})
    
  }
}


const updateUser = async (req, res) => {
    //pegando o id e as informações do body
    const {id} = req.user;
    const {nome, email, senha} = req.body;

    if (verifyItens(nome) || verifyItens(email) || verifyItens(senha)) {
        return res.status(400).json({ mensagem: missingInfo});
      }

    try {
        //Validando que o email é editado é único no banco de dados
        if (email) {
            const validEmail = await verifyEmail (email, id);
            if (!validEmail) {
                return res.status(400).json({mensagem: invalidEmail});
            }
        };

        //Separando as informações a serem atualizadas e colocando-as em um array para a query a seguir
        const updateItens = [];
        const values = [id];

        if (nome) {
            updateItens.push("nome = $" + (values.length +1));
            values.push(nome);
        }

        if (email) {
            updateItens.push("email = $" + (values.length +1)); 
            values.push(email);
        }

        if (senha) {
            const cryptPassword = await hashPassword(senha);
            updateItens.push("senha = $" + (values.length +1)); 
            values.push(cryptPassword);
        }

        const query = `update usuarios set ${updateItens.join(', ')} where id = $1`; 

        await pool.query(query, values); 

        return res.status(204).send();

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({mensagem: serverError});
        
    }
}

export { addUser, login, getUser, updateUser};