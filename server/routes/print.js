const express = require('express');
const router = express.Router();
const bwipjs = require('bwip-js');

// 生成条码/二维码的通用端点
router.get('/barcode', (req, res) => {
  const { text, type = 'code128', scale = 3, height = 10 } = req.query;

  if (!text) {
    return res.status(400).send('Missing text parameter');
  }

  bwipjs.toBuffer({
    bcid: type,       // 条码类型: code128, qrcode, datamatrix 等
    text: text,       // 条码内容
    scale: parseInt(scale),      // 缩放比例
    height: parseInt(height),     // 条码高度 (仅限线形条码)
    includetext: true,            // 底部显示文字
    textxalign: 'center',         // 文字居中
  }, function (err, png) {
    if (err) {
      console.error('生成条码失败:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.set('Content-Type', 'image/png');
      res.send(png);
    }
  });
});

module.exports = router;
