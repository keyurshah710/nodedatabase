const mysql = require('mysql');

// Setting up the Connection + Database
var con = mysql.createConnection({

	host: 'localhost',
	user: 'root',
	password: '',
	database: 'nodereg'

});


// Checking Connection if Error Then Throw Error
var connect = con.connect(function(err){
	if(!err){
		console.log("connect Sucessfully");
	}else{
		console.log("Not Connected");				
	}
});

exports.connect = connect;
exports.con = con;
