# Memories AI 回憶影片製作器

AI 智慧回憶影片製作工具 — 上傳照片/影片，AI 自動分析場合、產生標題文字、選擇最佳風格，一鍵完成婚禮、求婚、紀念日等重要場合的回憶影片。

## 功能列表

### 🤖 AI 智慧分析
- 上傳照片/影片後，AI 自動判斷場合（婚禮/求婚/紀念日/生日/畢業/旅行/追思/寶寶成長）
- 兩階段確認機制：AI 分析 → 使用者確認場合 → 自動生成內容
- 信心程度顯示（高/中/低）、關鍵證據、風險提醒
- 自動生成開場/結尾標題、每張照片文字說明
- 自動選擇最適合的轉場效果、字體、動畫
- 建議音樂風格
- 所有 AI 生成內容都可手動修改

### 📁 媒體管理
- 支援 JPG、PNG、WEBP 照片
- 支援 MP4、MOV、WEBM 影片
- 拖曳檔案到預覽區上傳
- 時間軸拖曳排序
- 隨機排序、反轉順序
- 復原功能（Ctrl+Z，最多 30 步）

### 🎨 風格設定
- 8 種主題風格
- 16 種轉場效果（淡入淡出、縮放、滑動、模糊、擦除、形狀展開等）
- 可調整照片秒數（1-12 秒）
- 可調整轉場時長（0.3-2 秒）

### ✏️ 文字設計
- 開場標題 + 副標題
- 結尾標題 + 副標題
- 每張照片獨立文字說明
- 文字位置（頂部/居中/底部）
- 5 種字體風格
- 4 種文字動畫（淡入/上升/放大/無）

### 🎵 背景音樂
- 上傳自己的音樂（MP3/WAV/AAC/OGG）
- 音量調節
- 播放時自動同步

### ⬇ 匯出
- WEBM 影片匯出（720p / 1080p）
- 背景音樂同步錄製
- JSON 專案設定匯出
- 匯出進度即時顯示

### 📱 介面
- 手機 + 桌面雙版面適配
- 全螢幕預覽
- 鍵盤快捷鍵（空白鍵播放、方向鍵切換、Ctrl+Z 復原）
- 循環播放

---

## 專案結構

```
memories-ai/
├── index.html          # 主頁面 HTML 結構
├── css/
│   └── style.css       # 所有樣式
├── js/
│   ├── config.js       # 常數設定（主題、轉場、字體等）
│   ├── state.js        # 全域狀態管理
│   ├── utils.js        # 共用工具函式
│   ├── media.js        # 媒體上傳與驗證
│   ├── ai.js           # AI 分析（兩階段確認）
│   ├── panels.js       # 面板 HTML 產生器
│   ├── timeline.js     # 時間軸管理
│   ├── canvas.js       # Canvas 繪製引擎
│   ├── playback.js     # 播放引擎
│   ├── export.js       # 匯出功能
│   └── app.js          # 初始化與事件綁定
└── README.md
```

---

## 部署方式

### Antigravity.ai / Netlify / Vercel
直接將整個資料夾上傳或連結 Git repo 即可，這是純靜態網站，不需要伺服器。

### 本地測試
```bash
# 用任何靜態伺服器
npx serve .
# 或
python3 -m http.server 8000
```

---

## AI API 說明

本工具使用 Anthropic Claude API 進行圖片分析。在 Claude.ai 環境中 API 呼叫由平台自動處理。

若要在自架環境中使用，需要：
1. 取得 Anthropic API Key
2. 修改 `js/ai.js` 中的 `callAIWithRetry` 函式，在 headers 加入 `x-api-key`
3. 或建立後端 proxy 來中轉 API 請求

---

## 自訂擴充

### 新增主題
編輯 `js/config.js` 中的 `THEMES` 陣列：
```javascript
{ id: 'your_id', name: '顯示名稱', emoji: '🎉' }
```

### 新增轉場效果
1. 在 `js/config.js` 的 `TRANSITIONS` 新增項目
2. 在 `js/canvas.js` 的 `applyTrans` switch 中新增對應的繪製邏輯

### 新增字體
1. 在 `index.html` 的 Google Fonts link 加入字體
2. 在 `js/config.js` 的 `FONTS` 新增項目

---

## 技術說明
- 純前端，無需後端伺服器
- Canvas 2D API 即時渲染
- MediaRecorder API 錄製匯出
- FileReader API 處理檔案（最大相容性）
- Anthropic Messages API 進行 AI 分析
