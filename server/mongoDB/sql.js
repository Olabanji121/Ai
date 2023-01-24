import mysql from 'mysql'

const sqlDb = mysql.createConnection({
  host:'localhost',
  user: 'root',
  password:"123Admin123",
  database:"aipost"

})


export default sqlDb