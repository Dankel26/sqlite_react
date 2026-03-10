// import { SQLiteDatabase } from 'react-native-sqlite-storage';
import SQLite from 'react-native-sqlite-storage';

const progPage = () => {

const db = SQLite.openDatabase(
  {
    name: 'estudiantes.db',
    location: 'default',
  },
  () => { console.log('Base de datos abierta'); },
  error => { console.log('Error', error); }
);
}
export default progPage;
