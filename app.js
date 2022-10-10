const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const hbs = require('express-handlebars');
//user define module connection.js
const connect = require('./connection');
const session = require('express-session');
const cookieparser = require('cookie-parser');
// console.log(cookieparser);
const fileupload = require('express-fileupload');
// const flash = require('connect-flash');
const uc = require('upper-case');
const url = require('url');
const popup = require('alert-node');
const fs = require('fs');
const urlencodedParser = bodyParser.urlencoded({extended: false});

//for creating handle bar helper use this module
const Handlebars = require('handlebars');
// popup("hello");
var sess; //Declare variable For storing session value

//Handlebar custom Helper for hbs
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('assign', function (varName, varValue, options) {
    if (!options.data.root) {
        options.data.root = {};
    }
    options.data.root[varName] = varValue;
});

app.engine('hbs',hbs({
	extname: 'hbs', 
	defaultLayout: 'layout',
	defaultDir: __dirname+'/view/layout',
	helpers: Handlebars
}));
// console.log(Handlebars);
// console.log(handlebar);

// app.use(popups());
app.set('view engine', 'hbs');
app.use(cookieparser());
app.use(fileupload());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true 
}));

//serving static file means providing the folder publicly and also seen by outside world. default it is secure and not seen by the outside world so u cannot use any images/css/js folder 
app.use(express.static('public'));

// app.use(flash());
// console.log(__dirname+'/views/');
app.get('/',function(request, response){
		response.render('index',{title: 'register'});  
		// console.log(response.body);
		// console.log(connect);
});

app.get("/login",function(request, response){

	response.render('login',{title: 'Login',email: request.cookies.email,password: request.cookies.password});
});


app.post('/reg',urlencodedParser,function(request, response){
// console.log(request.body);
	if(request.body.register){
		// popup("hello");
		if(!request.body.name || !request.body.email || !request.body.password || !request.body.gender || !request.files.imagefile.name){

			response.render('index',{
				title: 'register',
				ferr: 'Username required', 
				eerr: 'Email required',
				perr: 'Password required',
				gerr: 'required',
				ierr: 'Image Required'
			});  

		}else{
			

			var username = request.body.name;
			var email = request.body.email;
			var gender = request.body.gender;
			var password = request.body.password;
			var image = request.files.imagefile;
			// console.log(gender);
			// console.log(image.name);
			var sql = "SELECT email FROM reg WHERE email = '"+email+"'";
			// console.log(sql);
			// var result = [];
			connect.con.query(sql,function(err,result,fields){
				// console.log(result);
				if(!err){
					if(result[0]==null){
						let ext = "jpeg";
						// console.log(uc(request.files.imagefile.mimetype));
						if(uc(image.mimetype) === 'IMAGE'+"/"+uc(ext)){
							// popup("hello");
							if(image.mv("public/images/"+image.name)){
								insertdb();
							}else{
								popup("File May Corrupted or Harmfull Please Choose Another Image!")
								response.render("index");
							}
						}else{
							popup(".JPEG only");
							response.render("index");
						}
					}else{
						response.render('index');
						popup(email+" Email alerady Exist");
					}
				}else{
					throw err;
				}
			});
			// console.log(global.sameemail);
				
			const insertdb = function(){
				// Dynamic Value Comes From the HBS Form  
				var value = [[username,email,gender,password,image.name]];
				// Connect Come From The Connection.js Module && parameter First Query and then values
				var insert = "INSERT INTO reg (name,email,gender,password,profile) VALUES ?";
				connect.con.query(insert,[value],function(err,result){ 
					if(!err){
						response.render("index");
						popup(email+" Registerd sucessfully");
										
					}else{
						// response.render('index',{title: 'register', status: true, sucerr: 'Something Wents Wrong'});
						console.log("Something Error occure");
					}
				});
			}
		}
	}else{}
});

app.get("/dashboard",function(request,response){
	sess = request.session; // Request SESSION First For Retriving Value FROM SESSION 
	// console.log(sess);
	if(!sess.email && !sess.name){
		response.redirect("/login");
	}else{
		response.render('dashboard',{title: "Wellcome!",name: sess.name,email: sess.email,gender: sess.gender, profile: sess.profile});
	}	
});

app.get("/logout", function(request,response){
	sess = request.session; // Request SESSION First For Retriving Value FROM SESSION 
	sess.destroy(function(err){
		if(err){
			throw err;
		}else{
			response.redirect("/login");
		}
	});
	// console.log(sess);
});

app.get("/alogout",function(request, response){
	sess = request.session;
	sess.destroy(function(err){
		if(err){
			throw err;
		}else{
			response.redirect("/admin");
		}
	});
});

app.post("/login",urlencodedParser,function(request, response){
	sess = request.session; // Request SESSION First For Storing Value to SESSION  
	// console.log(sess);
	if(sess.email && sess.name){
		response.render('dashboard',{title: "Wellcome!",name: sess.name,email: sess.email});
	}
	// console.log(request.body);
	if(request.body.login){
		if(!request.body.email && !request.body.password){
			// console.log("Cool");
			response.render('login',{
				title: 'Login',
				eerr: 'Email required',
				perr: 'Password required'
			});  
		}
		else{
			var email = request.body.email;
			var pass  = request.body.password;
			var sql = "SELECT name,email,gender,password,profile FROM reg WHERE email = '"+email+"' AND password = '"+pass+"'";
			// console.log(sql);
			connect.con.query(sql,function(err,result,feild){
				if(!err){
					// console.log(result[0]['']);
					var length = result.length;
					if(result.length===1){
						if(request.body.rememberme){
							let email = result[0]['email'];
							let password = result[0]['password'];
							setcookie(email,password);
						}else{}
						sess = request.session; // Request SESSION First For Storing Value to SESSION  
						sess.name  = result[0]['name'];
						sess.email = result[0]['email'];
						sess.password = result[0]['password'];
						sess.gender = result[0]['gender'];
						sess.profile = result[0]['profile'];
						// console.log(sess);

						response.redirect("/dashboard");
					}else{
						response.render("login",{title: 'Login',status: true,usererr: 'Invalid User'})
					}
				}else{
					throw err;
				}	
			});
		}
	}

	const setcookie = function (useremail, userpassword){
		response.cookie('email',useremail,{maxAge: 60000});
		response.cookie('password',userpassword,{maxAge: 60000});
		// console.log(request.cookies.email);
		// console.log(request.cookies.password);
	}

});
	app.get("/admin",function(request,response){
		response.render('admin',{title: 'Admin',email: request.cookies.aemail,password: request.cookies.apassword});
	});

	app.get("/delete",function(request, response){
		let address = request.url;
		let query = url.parse(address,true);
		// console.log(query.query.id);
		let id = query.query.id;
		let profileunlink = "SELECT profile FROM reg WHERE id = '"+id+"'";
		connect.con.query(profileunlink,function(err,result){
			if(err){
				throw err;
			}else{
				try{
					fs.unlinkSync("./public/images/"+result[0]['profile']);
				}catch (err){
					console.log(err);
				}
			}
		});
		let dele = "DELETE FROM reg WHERE id = '"+id+"'";
		connect.con.query(dele,function(err){
			if(err){
				throw err;
			}else{
				response.redirect("/view");		
			}
		});
	});

	app.get("/update",function(request,response){
		sess = request.session;	
		if(!sess.uname){
			response.redirect("/admin");
		}else{
			let address = request.url;
			let query = url.parse(address,true);
			// console.log(query.query.id);
			global.id = query.query.id;
			// console.log(global.id);
			let = update = "SELECT * FROM reg WHERE id = '"+global.id+"'";
				connect.con.query(update,function(err,result,feild){
				if(!err){
					if(result.length===1){
						response.render("update",{
							title: "update",
							name:result[0]['name'],
							email:result[0]['email'],
							password:result[0]['password'],
							gender:result[0]['gender'],
							profile:result[0]['profile']
						});
						global.oldprofile = result[0]['profile'];
					}else{
						alert("Data Not Found");
					}
				}else{
					throw err;
				}
			});
		}
	});


	app.get("/view",function(request, response){

		sess = request.session;	
		if(!sess.uname){
			response.redirect("/admin");
		}else{
		
		let sql = "SELECT * FROM reg";
		connect.con.query(sql,function(err,result,feild){
			// console.log(result);
			if(result.length > 0){
				response.render("view",{
					title: sess.uname,
					name: sess.uname,
					status: true,
					result: result
				});
			}else{
				response.render("view",{
					title: sess.uname,
					name: sess.uname,
					status: false,
					nodata: "No Recorde"
				});
			}
		});
		}		
	});

	app.post("/admin",urlencodedParser,function(request, response){
		
		// console.log(request.body);
		var email = "admin";
		var password = "123456";

		if(request.body.admin){
			// console.log("helo");
			if(!request.body.email || !request.body.password){
				response.render("admin",{
					eerr: "required",
					perr: "required"
				});
			}else{
				if(request.body.email===email && request.body.password===password){
					// console.log("hello");
					if(request.body.rememberme){
						response.cookie('aemail',"admin",{maxAge: 60000});
						response.cookie('apassword',"123456",{maxAge: 60000});
					}

					sess = request.session;
					sess.uname = "Hello! "+email;
					response.redirect("/view");			
				}else{
					// console.log("invalid User");
					response.render("admin",{status: true,usererr: 'Invalid User'});
				}
			}
		}

	});

	app.post("/update",urlencodedParser,function(request,response){
			
			console.log(global.oldprofile);


			if(request.body.update){
				// console.log("helo");
				var image = request.files.imagefile;
				if(!request.body.name || !request.body.email || !request.body.password){
					response.render('update',{
						title: 'update',
						ferr: 'Username required', 
						eerr: 'Email required',
						perr: 'Password required'
					});  
				}else{
					var photo;
					if(global.oldprofile === image.name){
						photo = global.oldprofile;
					}else{
						try{
							fs.unlinkSync("./public/images/"+global.oldprofile);
						}catch(err){
							console.log(err);
						}
						image.mv("./public/images/"+image.name);
						photo = image.name;
					}
					let update = "UPDATE reg SET name = '"+request.body.name+"',email = '"+request.body.email+"',gender = '"+request.body.gender+"',password = '"+request.body.password+"',profile = '"+photo+"' WHERE id = '"+global.id+"'";
					connect.con.query(update,function(err){
						if(!err){
							response.redirect("/view");
						}else{
							throw err;
						}
					});

					// console.log(update);
				}
			}
	});
//we can use Wildecard  formate for validation the routing handle for 404 page not found
app.get('*', function(req, res){
  res.redirect("/login");
});
// response.send("hello");
app.listen(88,'localhost');