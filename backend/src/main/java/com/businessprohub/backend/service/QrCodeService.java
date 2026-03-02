package com.businessprohub.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;
import javax.imageio.ImageIO;

@Service
public class QrCodeService {

    @Value("${app.url}")
    private String appUrl;

    /**
     * Generates a QR code as a Base64 PNG data URL.
     * Encodes: {appUrl}/join-queue/{businessId}?queue_type={queueTypeId}
     */
    public String generateQrCodeDataUrl(String businessId, String queueTypeId) throws Exception {
        String content = appUrl + "/join-queue/" + businessId;
        if (queueTypeId != null && !queueTypeId.isBlank()) {
            content += "?queue_type=" + queueTypeId;
        }
        return generateFromContent(content, 300, 300);
    }

    public String generateFromContent(String content, int width, int height) throws Exception {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, width, height, hints);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
        return "data:image/png;base64," + base64;
    }
}
