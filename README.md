1st:
//INICIAR O NODE
	criar uma pasta abrir no terminal e usar o comando: npm init -y

2st:
//IMPORTAR O EXPRESS PARA O PROJETO
	comando no terminal: npm i express

3st:
//CRIAR UM ARQUIVO index.js
	abrir e importar o express e declarar uma constante app que recebe a função express(): 
		const express = require('express');
		const app = express();

4st:
//FAZER O APP RODAR NA PORTA 3001:
	app.listen(3001, ()=>console.log("SERVER is live at port: 3001"));

//para testar basta abrir o terminal e inserir o comando: node index.js

5st:
//COM O APP RODANDO NO SERVIDOR LOCAL, VAMOS COLOCÁ-LO EM UM SERVIÇO EXTERNO USANDO O (NGROK)
	para instalar no nosso progeto usamos o comando: npm i ngrok -g

6st:
//AGORA VAMOS GERAR O LINK DO SERVIÇO REMOTO
	para isso usamos o comando: ngrok http 3001
//onde 3001 é a porta do nosso serviço local
//ao executar esse comando será gerado um link http e https, como o seguinte link gerado: https://828c8f6dba80.ngrok.io/

7st:
//AGORA PARA TRABALHAR COM O NOSSO AGENTE DO DIALOGFLOW DEVEMOS INSTALAR AS DEPENDENCIAS DO DIALOGFLOW-FULFILLMENT E DO ACTIONS-ON-GOOGLE
	para isso usamos os comandos:
		npm i dialogflow-fulfillment
		npm i actions-on-google

8st:
//PARA FAZER REQUISIÇÕES HTTP USAREMOS O FETCH
	npm install node-fetch

	//não esquecer de importar no index.js
		const fetch = require("node-fetch");