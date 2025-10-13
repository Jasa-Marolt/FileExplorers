package repository

import (
	"database/sql"
	"file-explorers-be/models"
)

type AuthRepository interface {
	Authenticate(username string) (data models.User, err error)
	Register(username, email, password string) (data models.User, err error)
	PasswordChange(username, password string) (err error)
}

type authRepo struct {
	db *sql.DB
}

func NewAuthRepository(db *sql.DB) AuthRepository {
	return &authRepo{db: db}
}

func (repo *authRepo) Authenticate(username string) (data models.User, err error) {
	sql := "SELECT id, username, email, password_hash FROM users WHERE username=?"
	rows, err := repo.db.Query(sql, username)
	if err != nil {
		return
	}
	defer rows.Close()
	if rows.Next() {
		data = models.User{}
		err = rows.Scan(
			&data.ID,
			&data.Username,
			&data.Email,
			&data.Password,
		)
	}
	return
}

func (repo *authRepo) Register(username, email, password string) (data models.User, err error) {
	sql := "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?) "

	_, err = repo.db.Exec(sql, username, email, password)
	if err != nil {
		return
	}
	
	return repo.Authenticate(username)
}

func (repo *authRepo) PasswordChange(username, password string) (err error) {
	sql := "UPDATE users SET password_hash=$1 WHERE username=$2"
	_, err = repo.db.Exec(sql, password, username)
	return
}
