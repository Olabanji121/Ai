import mysql from 'mysql'

const sqlDb = mysql.createConnection({
  host:'aiphotodb.cbhsmfls9h3f.us-west-2.rds.amazonaws.com',
  user: 'admin',
  password:"mypassword",
  database:"aipost"

})


export default sqlDb