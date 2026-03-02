package com.businessprohub.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.security.spec.ECParameterSpec;
import java.security.interfaces.ECPublicKey;
import java.util.Base64;
import java.util.Date;

/**
 * Validates Supabase JWTs signed with ES256 (ECDSA P-256).
 *
 * Public key sourced from:
 *   https://hjblbmmyfznxomsrxhme.supabase.co/auth/v1/.well-known/jwks.json
 *   kid: 092ada20-3114-49db-a083-6f83afb4d9b6
 */
@Service
public class JwtService {

    // EC P-256 public key coordinates (base64url from JWKS)
    private static final String EC_X = "TuEPSUcTFaruWyh2AYRR1c7jMkBbwTFegIdTpm28Mnw";
    private static final String EC_Y = "jibMPsugKqIfaNp2M7AwCSM1ftOeMeNHEcWsUi5CAzA";

    private final PublicKey publicKey;

    public JwtService() {
        try {
            byte[] xBytes = Base64.getUrlDecoder().decode(EC_X);
            byte[] yBytes = Base64.getUrlDecoder().decode(EC_Y);
            BigInteger x = new BigInteger(1, xBytes);
            BigInteger y = new BigInteger(1, yBytes);

            // Get P-256 curve parameters via a dummy key generation
            java.security.AlgorithmParameters params =
                    java.security.AlgorithmParameters.getInstance("EC");
            params.init(new java.security.spec.ECGenParameterSpec("secp256r1"));
            ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

            ECPoint point = new ECPoint(x, y);
            ECPublicKeySpec keySpec = new ECPublicKeySpec(point, ecSpec);
            KeyFactory kf = KeyFactory.getInstance("EC");
            this.publicKey = kf.generatePublic(keySpec);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize Supabase EC public key", e);
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractEmail(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("email");
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
