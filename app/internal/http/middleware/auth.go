package middleware

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"ledger-api/app/internal/auth"
)

type supabaseClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// Auth validates the Supabase JWT from the Authorization header and stores
// the user token and ID in the request context for downstream use.
func Auth(jwtSecret string) gin.HandlerFunc {
	// Supabase signs JWTs with the base64-decoded secret bytes.
	// Fall back to raw bytes if the secret is not valid base64.
	keyBytes, err := base64.StdEncoding.DecodeString(jwtSecret)
	if err != nil {
		keyBytes = []byte(jwtSecret)
	}

	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims := &supabaseClaims{}

		_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return keyBytes, nil
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token", "detail": err.Error()})
			return
		}

		userID, err := claims.GetSubject()
		if err != nil || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing subject claim"})
			return
		}

		ctx := auth.WithUser(c.Request.Context(), tokenStr, userID)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
