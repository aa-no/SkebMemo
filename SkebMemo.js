// ==UserScript==
// @name         SkebMemo
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Save memo for user at skeb.jp
// @author       A. A.
// @match        *://skeb.jp/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function note_func() {
        var urlPath = window.location.pathname;

        // 分割URL路径，并查找以"@"开头的部分
        var segments = urlPath.split('/');
        var pageID = segments.find(segment => segment.startsWith('@'));

        if (!pageID) {
            console.warn('SkebMemo: Not a user page.');
            return;
        }

        // 初始化笔记存储
        var notes = JSON.parse(localStorage.getItem('notes') || '{}');

        // 找到页面中的第一个<div class="is-box">元素
        var targetDiv = document.querySelector('.is-box');
        if (!targetDiv) {
            console.error('SkebMemo: .is-box not found.');
            return;
        }

        // 创建一个容器来嵌入文本框和按钮
        var container = document.createElement('div');

        container.style.marginTop = '20px';
        targetDiv.parentNode.insertBefore(container, targetDiv.nextSibling);
        
        // 创建文本框元素
        var textBox = document.createElement('textarea');
        textBox.id = 'myTextBox';
        textBox.style.width = '100%';
        textBox.style.height = '200px';
        textBox.style.marginBottom = '10px';
        textBox.style.resize = 'vertical'; // 只能上下调整大小
        container.appendChild(textBox);
        
        // 创建查看笔记按钮
        var viewNotesButton = document.createElement('button');
        viewNotesButton.textContent = '查看所有笔记';
        viewNotesButton.style.fontFamily = 'Microsoft Yahei';
        // viewNotesButton.style.marginRight = '10px';
        container.appendChild(viewNotesButton);
        
        // 使用 flexbox 布局
        container.style.display = 'flex';
        container.style.flexDirection = 'column'; // 设置为列布局
        container.style.alignItems = 'flex-end'; // 将子元素对齐到右边        

        // 加载保存的内容
        textBox.value = notes[pageID] || '';

        // 监听文本框内容变化并保存
        // textBox.addEventListener('input', function() {
        //     notes[pageID] = textBox.value;
        //     localStorage.setItem('notes', JSON.stringify(notes));
        // });
        textBox.addEventListener('input', function() {
            if (textBox.value.trim() === '') {
                delete notes[pageID];
            } else {
                notes[pageID] = textBox.value;
            }
            localStorage.setItem('notes', JSON.stringify(notes));
        });

        // 查看所有笔记功能
        viewNotesButton.addEventListener('click', function() {
            var notesList = document.createElement('div');
            notesList.style.position = 'fixed';
            notesList.style.top = '50%';
            notesList.style.left = '50%';
            notesList.style.transform = 'translate(-50%, -50%)';
            notesList.style.width = '60%';
            notesList.style.height = '70%';
            notesList.style.overflow = 'auto';
            notesList.style.backgroundColor = 'white';
            notesList.style.zIndex = '1000';
            notesList.style.border = '1px solid black';
            notesList.style.padding = '20px';
            notesList.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';
            notesList.style.fontFamily = 'Microsoft Yahei';
            notesList.id = 'notesList';
        
            var header = document.createElement('h2');
            header.textContent = '笔记列表';
            // header.style.marginBottom = '10px';
            header.style.textAlign = 'center';
            header.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(header);
        
            var searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = '搜索笔记';
            searchInput.style.width = '100%';
            searchInput.style.marginBottom = '10px';
            // searchInput.style.marginTop = '10px';
            searchInput.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(searchInput);
        
            var notesContainer = document.createElement('div');
            notesContainer.style.display = 'grid';
            notesContainer.style.gridTemplateColumns = '1fr 3fr 1fr';
            notesContainer.style.gap = '10px';
            notesContainer.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(notesContainer);
        
            var exportNotesButton = document.createElement('button');
            exportNotesButton.textContent = '导出笔记';
            exportNotesButton.style.position = 'absolute';
            exportNotesButton.style.top = '10px';
            exportNotesButton.style.left = '10px';
            exportNotesButton.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(exportNotesButton);
        
            var closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.fontFamily = 'Microsoft Yahei';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(notesList);
            });
            notesList.appendChild(closeButton);
        
            document.body.appendChild(notesList);
        
            function renderNotes(filter = '') {
                notesContainer.innerHTML = '';
                for (var id in notes) {
                    if (notes.hasOwnProperty(id) && notes[id].includes(filter)) {
                        var noteItem = document.createElement('div');
                        noteItem.style.display = 'contents';
        
                        var noteID = document.createElement('a');
                        noteID.href = `https://skeb.jp/${id}`;
                        noteID.textContent = id;
                        noteID.target = '_blank';
                        noteID.style.textDecoration = 'none';
                        noteID.style.color = 'blue';
                        noteID.style.fontFamily = 'Microsoft Yahei';
                        notesContainer.appendChild(noteID);
        
                        var noteText = document.createElement('div');
                        noteText.textContent = notes[id];
                        noteText.style.fontFamily = 'Microsoft Yahei';
                        notesContainer.appendChild(noteText);
        
                        var deleteButton = document.createElement('button');
                        deleteButton.textContent = '删除';
                        deleteButton.style.marginLeft = '10px';
                        deleteButton.style.float = 'right';
                        deleteButton.style.fontFamily = 'Microsoft Yahei';
                        deleteButton.addEventListener('click', function(id) {
                            return function() {
                                delete notes[id];
                                localStorage.setItem('notes', JSON.stringify(notes));
                                renderNotes(filter);
                            };
                        }(id));
                        notesContainer.appendChild(deleteButton);
                    }
                }
            }
        
            searchInput.addEventListener('input', function() {
                renderNotes(searchInput.value);
            });
        
            renderNotes();
        
            exportNotesButton.addEventListener('click', function() {
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
                var downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "notes.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            });
        });        
    }        

    function add_observer() {
        let body = document.body;
        let observer = new MutationObserver(mutations => {
            let targetDiv = document.querySelector('.is-box');
            if (targetDiv) {
                observer.disconnect(); // 停止观察
                note_func();
            }
        });
        observer.observe(body, { childList: true, subtree: true });
    }

    add_observer();
})();
