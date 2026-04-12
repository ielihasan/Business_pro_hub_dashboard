package com.businessprohub.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Validates Supabase JWTs signed with ES256 (ECDSA P-256).
 *
 * Keys are loaded dynamically from the Supabase JWKS endpoint on startup and
 * refreshed every hour.  A hardcoded fallback key ensures auth works even when
 * the JWKS endpoint is temporarily unreachable (e.g. during cold start).
 *
 * JWKS endpoint: {supabase.url}/auth/v1/.well-known/jwks.json
 */
@Slf4j
@Service
public class JwtService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    // ── Fallback: current known-good Supabase EC public key ──────────────────
    // kid: 092ada20-3114-49db-a083-6f83afb4d9b6
    private static final String FALLBACK_KID = "092ada20-3114-49db-a083-6f83afb4d9b6";
    private static final String FALLBACK_X   = "TuEPSUcTFaruWyh2AYRR1c7jMkBbwTFegIdTpm28Mnw";
    private static final String FALLBACK_Y   = "jibMPsugKqIfaNp2M7AwCSM1ftOeMeNHEcWsUi5CAzA";

    private static final Duration CACHE_TTL  = Duration.ofHours(1);

    private volatile Map<String, PublicKey> jwksCache = new ConcurrentHashMap<>();
    private volatile Instant lastFetched = Instant.EPOCH;

    // ── Startup ───────────────────────────────────────────────────────────────

    @PostConstruct
    public void init() {
        // Seed with hardcoded fallback so auth works even if JWKS is unreachable
        try {
            jwksCache.put(FALLBACK_KID, buildEcKey(FALLBACK_X, FALLBACK_Y));
            log.debug("Fallback EC public key loaded (kid={})", FALLBACK_KID);
        } catch (Exception e) {
            log.error("Failed to load fallback EC public key: {}", e.getMessage(), e);
        }
        // Attempt to load fresh keys from the live JWKS endpoint
        refreshJwks();
    }

    // ── JWKS refresh ─────────────────────────────────────────────────────────

    synchronized void refreshJwks() {
        try {
            String url = supabaseUrl + "/auth/v1/.well-known/jwks.json";
            RestTemplate rest = new RestTemplate();
            @SuppressWarnings("unchecked")
            Map<String, Object> body = rest.getForObject(url, Map.class);
            if (body == null) return;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> keys = (List<Map<String, Object>>) body.get("keys");
            if (keys == null || keys.isEmpty()) return;

            Map<String, PublicKey> fresh = new ConcurrentHashMap<>();
            for (Map<String, Object> jwk : keys) {
                String kty = (String) jwk.get("kty");
                String kid = (String) jwk.get("kid");
                if (!"EC".equals(kty) || kid == null) continue;
                String x = (String) jwk.get("x");
                String y = (String) jwk.get("y");
                if (x == null || y == null) continue;
                try {
                    fresh.put(kid, buildEcKey(x, y));
                } catch (Exception e) {
                    log.warn("Skipping JWK kid={}: could not parse key — {}", kid, e.getMessage());
                }
            }
            if (!fresh.isEmpty()) {
                jwksCache = fresh;
                lastFetched = Instant.now();
                log.info("JWKS refreshed: {} key(s) loaded from {}", fresh.size(), url);
            }
        } catch (Exception e) {
            log.warn("JWKS refresh failed (continuing with cached keys): {}", e.getMessage());
        }
    }

    /** Resolve a verification key by kid, triggering a refresh if TTL has expired or kid is unknown. */
    private PublicKey resolveKey(String kid) {
        // Refresh if cache is stale
        if (Duration.between(lastFetched, Instant.now()).compareTo(CACHE_TTL) > 0) {
            refreshJwks();
        }
        if (kid != null) {
            PublicKey key = jwksCache.get(kid);
            if (key != null) return key;
            // kid not in cache — try a fresh fetch (handles key rotation)
            log.warn("JWT kid='{}' not found in JWKS cache; attempting refresh", kid);
            refreshJwks();
            key = jwksCache.get(kid);
            if (key != null) return key;
        }
        // Last resort: return the first available key
        return jwksCache.values().stream().findFirst()
                .orElseThrow(() -> new JwtException("No public key available for JWT validation"));
    }

    // ── JWT parsing ───────────────────────────────────────────────────────────

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .keyLocator(header -> resolveKey((String) header.get("kid")))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractEmail(String token) {
        return (String) extractAllClaims(token).get("email");
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ── EC key builder ────────────────────────────────────────────────────────

    private static PublicKey buildEcKey(String xBase64url, String yBase64url) throws Exception {
        byte[] xBytes = Base64.getUrlDecoder().decode(xBase64url);
        byte[] yBytes = Base64.getUrlDecoder().decode(yBase64url);
        BigInteger x = new BigInteger(1, xBytes);
        BigInteger y = new BigInteger(1, yBytes);

        java.security.AlgorithmParameters params =
                java.security.AlgorithmParameters.getInstance("EC");
        params.init(new java.security.spec.ECGenParameterSpec("secp256r1"));
        ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

        ECPublicKeySpec keySpec = new ECPublicKeySpec(new ECPoint(x, y), ecSpec);
        return KeyFactory.getInstance("EC").generatePublic(keySpec);
    }
}
