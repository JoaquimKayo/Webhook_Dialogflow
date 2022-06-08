//import { Handler, Context, Callback } from "aws-lambda";
const fetch = require("node-fetch");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Pool, Client } = require("pg");

//Imports para o Natural Language Understanding
const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const { IamAuthenticator } = require("ibm-watson/auth");
process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

const serverless = require("serverless-http");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("We are LIVE!!");
});

app.post("/", express.json(), (request, response) => {
  const agent = new WebhookClient({ request, response });
  //console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  //console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({
      apikey: "DdZxcNjDmhfw8NFdsac5xsuHIRO4m-t0h5619itNtUar",
    }),
    version: "2018-11-16",
    serviceUrl:
      "https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/6420bb46-ce9c-4e45-a997-9b59060889cc",
  });
  
  const pool = new Pool({
    user: "postgres",
    host: "joaquimkayo.japaneast.cloudapp.azure.com",
    database: "webhook_dialogflow",
    password: "13579",
    port: "5432",
  });

  function soma(agent) {
    const n1 = parseInt(agent.parameters.number1);
    const n2 = parseInt(agent.parameters.number2);
    var soma = n1 + n2;

    agent.add(
      `Ao somar ` + n1 + ` com ` + n2 + ` temos como resultado: ` + soma
    );
  }

  async function cep(agent) {
    const cep = agent.parameters.CEP;

    try {
      const cepResponse = await viaCep(cep);
      const data = await cepResponse.json();
      if (data.localidade) {
        agent.add(
          "CEP Consultado com sucesso!!" +
            "\nCEP: " +
            data.cep +
            "\nLogradouro: " +
            data.logradouro +
            "\nBairro: " +
            data.bairro +
            "\nCidade: " +
            data.localidade +
            "\nUF: " +
            data.uf
        );
      } else {
        console.log("Não encontrou: " + data.error);
        agent.add("Não foi encontrado endereço para esse CEP!");
      }
    } catch (error) {
      console.log("Ops.. deu ruim: " + error);
      agent.add("Não foi encontrado endereço para esse CEP!");
    }
  }

  function viaCep(cep) {
    return fetch(`https://viacep.com.br/ws/${cep}/json/`);
  }

  async function analiseSentimento(agent) {
    const textUser = request.body.queryResult.queryText;

    var sentimento = {
      analise: "Não identificado",
      pontuacao: "0",
      frase: textUser,
    };

    console.log("texto: " + textUser);
    try{
        const response = await nlu.analyze({
            text: textUser, // Buffer or String
            features: {
            sentiment: {},
            emotion: {},
            },
        });
        console.log("response",response);
        console.log("NLU - Response",JSON.stringify(response.result, null, 2)); // exibir o retorno da requisição no log

        sentimento.analise = response.result.sentiment.document.label;
        sentimento.pontuacao = response.result.sentiment.document.score;

        console.log(
            "Sentimento: " + sentimento.analise + "(" + sentimento.pontuacao + ")"
        );
        agent.add(
            "Obrigado pelo seu feedback, quando precisar é só me chamar ;)"
        );

        //chamar função para inserir a analise, a pontuação e a frase na tabela
        await inserir(sentimento.analise, parseFloat(sentimento.pontuacao), sentimento.frase);
    }catch(err){
        console.log("error: ", err);
        agent.add(
          "Obrigado pelo seu feedback, quando precisar é só me chamar ;)"
        );
        await inserir("N/A", 0, sentimento.frase);
    }
  }

  async function inserir(analise, pontuacao, frase) {
    const sql = `INSERT INTO AnaliseSentimento(sentimento, pontuacao, frase) VALUES ('${analise}',${pontuacao},'${frase}')`;
    console.log("SQL", sql);
    
    try{
        const res = await pool.query(sql);

        // log the response to console
        console.log("Postgres response:", res);

        // get the keys for the response object
        var keys = Object.keys(res);

        // log the response keys to console
        console.log("\nkeys type:", typeof keys);
        console.log("keys for Postgres response:", keys);

        if (res.rowCount > 0) {
            console.log("# of records inserted:", res.rowCount);
        } else {
            console.log("No records were inserted.");
        }
    }catch(err){
        // log the error to console
        console.error("Postgres INSERT error:", err);

        // get the keys for the error
        var keys = Object.keys(err);
        console.error("\nkeys for Postgres error:", keys);

        // get the error position of SQL string
        console.error("Postgres error position:", err.position);
    }finally{
        await pool.end();
    }
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set("Soma", soma);
  intentMap.set("CEP", cep);
  intentMap.set("AnalisarSentimentoFrase", analiseSentimento);
  intentMap.set("Avaliacao_atendimento - yes - custom", analiseSentimento);
  intentMap.set("Avaliacao_atendimento - no - custom", analiseSentimento);

  agent.handleRequest(intentMap);
});

module.exports.handler = serverless(app);
