var app  = require('express')()
var bodyParser  = require('body-parser');
var cors = require('cors');
var busboy = require('connect-busboy');
var mysql = require('mysql');
var admin = require('firebase-admin');

var serviceAccount = require('./borra_firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://borraanov2.firebaseio.com"
});


//bodyparser needs
app.use(bodyParser.urlencoded({
  extended: true
}));

//bodyParse/Cors/Busboy
app.use(bodyParser.json({ extended: true }));
app.use(cors());
app.use(busboy()); 

//database
var pool  = mysql.createPool({
	connectionLimit : 20,
	host     : 'wiad5ra41q8129zn.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
	port : '3306',
	user     : 'jetrjndq6ikujs3o',
	password : 'c8p90jmosf1g421e',
	database: 'de16anduu638df6a'
  });

app.use(function(err, req, res, next) {
  next(err);
});


//Inicio das Rotas
//getId: Retorna o Id da token de instalacao
app.post('/getId', function(req, res) {
	pool.getConnection(function(err, connection) {		
		var string = 'select * from usuario where token = "'+req.body.token+'"';
		console.log(string);
		connection.query(string , function(err, data) {
			if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			//adiciona o id novo se ja nao existir
			if (data === 'undefined'|| data.length == 0){				
				var string1 = 'insert into usuario(token,token_firebase) values("'+req.body.token+'","'+req.body.token_firebase+'")';
				console.log(string1);
				connection.query(string1 , function(err, data1) {
					if (err){
						var error = {};
						error.type = 1;
						error.msg = err;
						connection.release();
						return res.jsonp(error);
					}
					console.log(data1);
					var registrationTokens = [req.body.token_firebase];
					admin.messaging().subscribeToTopic(registrationTokens , 'borra_do_ano')
					  .then(function(response) {
						// See the MessagingTopicManagementResponse reference documentation
						// for the contents of response.
						console.log('Successfully subscribed to topic:', response);
					  })
					  .catch(function(error) {
						console.log('Error subscribing to topic:', error);
					  });
					  
					var string3 = 'select * from usuario where token = "'+req.body.token+'"';
					console.log(string3);
					connection.query(string3 , function(err, data3) {
						if (err){
							var error = {};
							error.type = 1;
							error.msg = err;
							connection.release();
							return res.jsonp(error);
						}
						connection.release();
						return res.jsonp(data3);
					});	
				});
			//ja existe, retorna o usuario completo
			}else{
				var string2 = 'update usuario set token_firebase = "'+req.body.token_firebase+'" where token = "'+req.body.token+'"';
				console.log(string2);
				connection.query(string2 , function(err, data2) {
					if (err){
						var error = {};
						error.type = 1;
						error.msg = err;
						connection.release();
						return res.jsonp(error);
					}
					console.log(data2)
					var registrationTokens = [req.body.token_firebase];
					admin.messaging().subscribeToTopic(registrationTokens , 'borra_do_ano')
					  .then(function(response) {
						// See the MessagingTopicManagementResponse reference documentation
						// for the contents of response.
						console.log('Successfully subscribed to topic:', response);
					  })
					  .catch(function(error) {
						console.log('Error subscribing to topic:', error);
					  });
					  
					var string4 = 'select * from usuario where token = "'+req.body.token+'"';
					console.log(string4);
					connection.query(string4 , function(err, data4) {
						if (err){
							var error = {};
							error.type = 1;
							error.msg = err;
							connection.release();
							return res.jsonp(error);
						}
						connection.release();
						return res.jsonp(data4);
					});	
				});
			}			
		});
	});	
});

//getAllMsgs: Busca todas as mensagens
app.get('/getAllBorras', function(req, res) {	
	pool.getConnection(function(err, connection) {	
		var string = 'SELECT * from borra order by pontos desc';		
		console.log(string);
		connection.query(string, function(err, data) {
			if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}	
			connection.release();
			return res.jsonp(data);
		});
	});
});

//getAllEnquetes: Busca todas as enquetes
app.post('/getAllEnquetes', function(req, res) {	
	pool.getConnection(function(err, connection) {	
		var string = 'SELECT s.*, (select resposta from enquete_x_usuario where id_usuario = '+req.body.id_usuario+' and id_enquete = s.id) as resposta, (select respondido from enquete_x_usuario where id_usuario = '+req.body.id_usuario+' and id_enquete = s.id) as respondido FROM enquete as s ORDER BY s.data_criacao desc  LIMIT 0,15';
		console.log(string);
		connection.query(string, function(err, data) {
			if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}	
			connection.release();
			return res.jsonp(data);
		});
	});
});

//replayPoll: Atualiza a enquete com a resposta
app.post('/replayPoll', function(req, res) {
	pool.getConnection(function(err, connection) {
		var string = 'insert into enquete_x_usuario(id_usuario, id_enquete, resposta, respondido) values('+req.body.id_usuario+','+req.body.id_enquete+','+req.body.resposta+',true)';
		console.log(string);
		connection.query(string , function(err, data) {
		if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			var string1 = 'UPDATE borra SET pontos = pontos + 1 WHERE id = '+req.body.id_opcao;
			console.log(string1);
			connection.query(string1 , function(err, data1) {
			if (err){
					var error = {};
					error.type = 1;
					error.msg = err;
					connection.release();
					return res.jsonp(error);
				}
				var string_votacao = ""
				if(req.body.resposta==1){
					string_votacao = 'update enquete set opcao_1_qtd = opcao_1_qtd+1 where id = '+req.body.id_enquete;
				}else if(req.body.resposta==2){
					string_votacao = 'update enquete set opcao_2_qtd = opcao_2_qtd+1 where id = '+req.body.id_enquete;
				}else if(req.body.resposta==3){
					string_votacao = 'update enquete set opcao_3_qtd = opcao_3_qtd+1 where id = '+req.body.id_enquete;
				}else if(req.body.resposta==4){
					string_votacao = 'update enquete set opcao_4_qtd = opcao_4_qtd+1 where id = '+req.body.id_enquete;
				}
				console.log(string_votacao);
				connection.query(string_votacao , function(err, data2) {
				if (err){
						var error = {};
						error.type = 1;
						error.msg = err;
						connection.release();
						return res.jsonp(error);
					}
					connection.release();
					return res.jsonp("Enquete Respondida com sucesso");
				});
			});
		});
	});	
});

//newPoll: Cria Nova Enquete
app.post('/newPoll', function(req, res) {
	pool.getConnection(function(err, connection) {
		if(req.body.opcao_1=="" || typeof req.body.opcao_1 == 'undefined'){
			req.body.opcao_1 = null;
		}
		if(req.body.opcao_2=="" || typeof req.body.opcao_2 == 'undefined'){
			req.body.opcao_2 = null;
		}
		if(req.body.opcao_3=="" || typeof req.body.opcao_3 == 'undefined'){
			req.body.opcao_3 = null;
		}
		if(req.body.opcao_4=="" || typeof req.body.opcao_4 == 'undefined'){
			req.body.opcao_4 = null;
		}
		if(req.body.id_opcao_1=="" || typeof req.body.id_opcao_1 == 'undefined'){
			req.body.id_opcao_1 = null;
		}
		if(req.body.id_opcao_2=="" || typeof req.body.id_opcao_2 == 'undefined'){
			req.body.id_opcao_2 = null;
		}
		if(req.body.id_opcao_3=="" || typeof req.body.id_opcao_3 == 'undefined'){
			req.body.id_opcao_3 = null;
		}
		if(req.body.id_opcao_4=="" || typeof req.body.id_opcao_4 == 'undefined'){
			req.body.id_opcao_4 = null;
		}
		
		var string = 'insert into enquete(descricao,data_criacao,data_fim,opcao_1,opcao_2,opcao_3,opcao_4,id_opcao_1,id_opcao_2,id_opcao_3,id_opcao_4) values("'+req.body.descricao+'",now(),"'+req.body.data_fim+'","'+req.body.opcao_1+'","'+req.body.opcao_2+'","'+req.body.opcao_3+'","'+req.body.opcao_4+'",'+req.body.id_opcao_1+','+req.body.id_opcao_2+','+req.body.id_opcao_3+','+req.body.id_opcao_4+')';
		console.log(string);
		connection.query(string , function(err, data) {
		if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			
			// The topic name can be optionally prefixed with "/topics/".
			var topic = 'borra_do_ano';

			// See documentation on defining a message payload.	
			var message = {
			  notification: {
				title: 'Nova Enquete',
				body: 'Nova enquete seu Borra, clique aqui para visualizar.'
			  },
			   topic: topic
			};

			

			// Send a message to devices subscribed to the provided topic.
			admin.messaging().send(message)
			  .then((response) => {
				// Response is a message ID string.
				console.log('Successfully sent message:', response);
			  })
			  .catch((error) => {
				console.log('Error sending message:', error);
			  });
			
			
			connection.release();
			return res.jsonp("Enquete Criada com sucesso");
		});
	});	
});

//configuracao para o heroku
app.listen(process.env.PORT || 5000)

console.log('Listening');