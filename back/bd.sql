create database LocalSave;
use LocalSave;


create table usuario(
  id INT AUTO_INCREMENT PRIMARY KEY,
  emailUsuario VARCHAR(255) NOT NULL UNIQUE,
  passwordUsuario VARCHAR (20) NOT NULL,

)
create table inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  cantidad INT NOT NULL,
  tipo VARCHAR(255),
  imagen VARCHAR(255),
  id_usuario INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);