package service

import (
	"context"
	"file-explorers-be/config"
	"file-explorers-be/models"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	ContextKeyHttpRequest contextKey = "httpRequest"
)

type JWTClaims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

type JwtService interface {
	GenerateToken(user models.User) (string, error)
	DecodeTokenFromCtx(ctx context.Context) (claims *JWTClaims, err error)
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

func (s *jwtService) DecodeTokenFromCtx(ctx context.Context) (claims *JWTClaims, err error) {
	tokenString, err := s.extractTokenFromCtx(ctx)
	if err != nil {
		return
	}

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.secretKey), nil
	})
	if err != nil {
		return
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, fmt.Errorf("invalid token claims")
	}
}

func (s *jwtService) extractTokenFromCtx(ctx context.Context) (string, error) {
	fmt.Println(ctx)
	req, ok := ctx.Value(ContextKeyHttpRequest).(*http.Request)
	if !ok {
		return "", fmt.Errorf("no http request in context")
	}
	authHeader := req.Header.Get("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("no Authorization header")
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", fmt.Errorf("invalid Authorization header format")
	}
	return parts[1], nil
}
