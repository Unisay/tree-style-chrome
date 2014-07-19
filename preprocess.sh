#!/bin/bash
lessc css/content.less css/content.css
lessc css/iframe.less css/iframe.css
jsx js/content-jsx.js | tee js/content.js