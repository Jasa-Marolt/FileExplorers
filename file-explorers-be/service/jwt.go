package service

import (
	"file-explorers-be/config"
	"file-explorers-be/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

type JwtService interface {
	GenerateToken(user models.User) (string, error)
}

type jwtService struct {
	secretKey string
	issuer    string
}

func NewJwtService(cfg config.Config) JwtService {
	return &jwtService{
		secretKey: cfg.JwtSecret,
		issuer:    cfg.JwtIssuer,
	}
}

func (s *jwtService) GenerateToken(user models.User) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   user.Username,
			Audience:  []string{"file-explorers"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(s.secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
