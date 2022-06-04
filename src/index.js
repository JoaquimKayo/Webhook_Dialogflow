//import { Handler, Context, Callback } from "aws-lambda";
const fetch = require("node-fetch");
const { WebhookClient } = require('dialogflow-fulfillment');
const { Pool } = require("pg");

//Imports para o Natural Language Understanding
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: 'DdZxcNjDmhfw8NFdsac5xsuHIRO4m-t0h5619itNtUar' }),
    version: '2018-11-16',
    serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/6420bb46-ce9c-4e45-a997-9b59060889cc'
});

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send("We are LIVE!!")
});

app.post('/', express.json(), (request, response) => {
    const agent = new WebhookClient({ request, response });
    //console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    //console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    const pool = new Pool({
        user: 'postgres',
        host: 'joaquimkayo.japaneast.cloudapp.azure.com',
        database: 'webhook_dialogflow',
        password: '13579',
        port: 5432
    });

    function soma(agent) {
        const n1 = parseInt(agent.parameters.number1);
        const n2 = parseInt(agent.parameters.number2);
        var soma = n1 + n2;

        agent.add(`Ao somar ` + n1 + ` com ` + n2 + ` temos como resultado: ` + soma);
    }

    async function cep(agent) {
        const cep = agent.parameters.CEP;

        try {
            const cepResponse = await viaCep(cep);
            const data = await cepResponse.json();
            if (data.localidade) {
                agent.add("CEP Consultado com sucesso!!" +
                    "\nCEP: " + data.cep +
                    "\nLogradouro: " + data.logradouro +
                    "\nBairro: " + data.bairro +
                    "\nCidade: " + data.localidade +
                    "\nUF: " + data.uf);
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

    function analiseSentimento(agent) {
        const textUser = request.body.queryResult.queryText;

        var sentimento = {
            analise: "Não identificado",
            pontuacao: "0",
            frase: textUser
        }

        console.log("texto: " + textUser);

        return nlu.analyze(
            {
                text: textUser, // Buffer or String
                features: {
                    sentiment: {},
                    emotion: {}
                }
            })
            .then(response => {
                console.log(JSON.stringify(response.result, null, 2)); // exibir o retorno da requisição no log

                sentimento.analise = response.result.sentiment.document.label;
                sentimento.pontuacao = response.result.sentiment.document.score;

                console.log("Sentimento: " + sentimento.analise + "(" + sentimento.pontuacao + ")");
                agent.add("Obrigado pelo seu feedback, quando precisar é só me chamar ;)");

                //chamar função para inserir a analise, a pontuação e a frase na tabela
                inserir(sentimento.analise, sentimento.pontuacao, sentimento.frase);
            })
            .catch(err => {
                console.log('error: ', err);
                agent.add("Obrigado pelo seu feedback, quando precisar é só me chamar ;)");
                inserir("N/A", 0, sentimento.frase);
            });
    }

    function inserir(analise, pontuacao, frase){
            const sql = 'INSERT INTO AnaliseSentimento(sentimento, pontuacao, frase) VALUES ($1,$2, $3);';
            const values = [analise, pontuacao, frase];
            try{
              pool.query(sql, values);
              pool.end();
              console.log("dados inseridos");
            }catch(e){
              console.error("Erro ao inserir dados", e);
            }
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Soma', soma);
    intentMap.set('CEP', cep);
    intentMap.set('AnalisarSentimentoFrase', analiseSentimento);
    intentMap.set('Avaliacao_atendimento - yes - fallback', analiseSentimento);
    intentMap.set('Avaliacao_atendimento - no - fallback', analiseSentimento);

    agent.handleRequest(intentMap);
});

module.exports.handler = serverless(app);