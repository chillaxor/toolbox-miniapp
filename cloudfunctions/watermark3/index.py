import cv2
import numpy as np
import base64
import json
import os


def imdecode_base64(b64_str):
    if ',' in b64_str:
        b64_str = b64_str.split(',', 1)[1]
    img_bytes = base64.b64decode(b64_str)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    return cv2.imdecode(img_array, cv2.IMREAD_COLOR)


def imencode_base64(img, ext='.png'):
    success, buf = cv2.imencode(ext, img)
    if not success:
        raise RuntimeError("图片编码失败")
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def remove_watermark(img_cv, x1, y1, x2, y2, inpaint_radius=5, feather=8, sharpen=True):
    h, w = img_cv.shape[:2]

    mask = np.zeros((h, w), dtype=np.uint8)
    mask[y1:y2, x1:x2] = 255

    if feather > 0:
        ksize = feather * 2 + 1
        mask = cv2.GaussianBlur(mask, (ksize, ksize), feather / 2)
        mask = (mask / mask.max() * 255).astype(np.uint8)

    result = cv2.inpaint(img_cv, mask, inpaintRadius=inpaint_radius, flags=cv2.INPAINT_TELEA)

    if sharpen:
        kernel = np.array([[-1, -1, -1],
                           [-1,  9, -1],
                           [-1, -1, -1]], dtype=np.float32)
        sharpened = cv2.filter2D(result, -1, kernel)

        mask_3ch = cv2.merge([mask, mask, mask]) / 255.0
        result = (result * (1 - mask_3ch) + sharpened * mask_3ch).astype(np.uint8)

    return result


def main_handler(event, context):
    try:
        body = event
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])

        img_b64 = body.get("img_base64") or body.get("imgBase64") or body.get("image")
        if not img_b64:
            return {"code": -1, "msg": "缺少参数 img_base64（图片 base64 数据）"}

        x1 = body.get("x1", 0)
        y1 = body.get("y1", 0)
        x2 = body.get("x2", 0)
        y2 = body.get("y2", 0)

        inpaint_radius = body.get("inpaint_radius", 5)
        feather = body.get("feather", 8)
        sharpen = body.get("sharpen", True)

        img_cv = imdecode_base64(img_b64)
        if img_cv is None:
            return {"code": -1, "msg": "图片解码失败，请检查 base64 数据"}

        result = remove_watermark(img_cv, x1, y1, x2, y2, inpaint_radius, feather, sharpen)

        result_b64 = imencode_base64(result, '.png')
        return {"code": 0, "msg": "处理完成", "new_img_base64": result_b64}

    except Exception as e:
        return {"code": -1, "msg": str(e)}