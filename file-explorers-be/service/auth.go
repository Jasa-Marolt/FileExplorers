package service

import (
	"file-explorers-be/repository"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = fmt.Errorf("Invalid username or password")
)

type AuthService interface {
	Authenticate(username, password string) (jwt string, err error)
	Register(username, email, password string) (jwt string, err error)
	PasswordChange(username, old, password string) (err error)
}

type authService struct {
	jwtService JwtService
	repo       repository.AuthRepository
}

func NewAuthService(repo repository.AuthRepository, jwtService JwtService) AuthService {
	return &authService{
		repo:       repo,
		jwtService: jwtService,
	}
}

func (s *authService) Authenticate(username, password string) (jwt string, err error) {
	data, err := s.repo.Authenticate(username)
	if err != nil {
		return
	}

	if !s.checkPasswordHash(password, data.Password) {
		return "", ErrInvalidCredentials
	}

	return s.jwtService.GenerateToken(data)
}

func (s *authService) Register(username, email, password string) (jwt string, err error) {
	hashedPassword, err := s.hashPassword(password)
	if err != nil {
		return
	}

	data, err := s.repo.Register(username, email, hashedPassword)
	if err != nil {
		return
	}

	return s.jwtService.GenerateToken(data)
}

func (s *authService) PasswordChange(username, old, password string) (err error) {
	_, err = s.Authenticate(username, old)
	if err != nil {
		return err
	}

	hashedPassword, err := s.hashPassword(password)
	if err != nil {
		return err
	}

	return s.repo.PasswordChange(username, hashedPassword)
}

func (s *authService) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func (s *authService) checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
