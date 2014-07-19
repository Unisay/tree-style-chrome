#!/bin/bash
lessc css/content.less css/content.css
lessc css/iframe.less css/iframe.css
jsx js/components.jsx.js | tee js/content.js
cat js/main.js | tee -a js/content.js