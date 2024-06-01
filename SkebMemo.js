// ==UserScript==
// @name         SkebMemo
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Save memo for user at skeb.jp
// @author       A. A.
// @match        *://skeb.jp/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function note_func() {
        var urlPath = window.location.pathname;

        // Find user name
        var segments = urlPath.split('/');
        var pageID = segments.find(segment => segment.startsWith('@'));

        if (!pageID) {
            console.warn('SkebMemo: Not a user page.');
            return;
        }

        // Initialize notes object
        var notes = JSON.parse(localStorage.getItem('notes') || '{}');

        // Find info box
        var targetDiv = document.querySelector('.is-box');
        if (!targetDiv) {
            console.error('SkebMemo: .is-box not found.');
            return;
        }

        var container = document.createElement('div');

        container.style.marginTop = '20px';
        targetDiv.parentNode.insertBefore(container, targetDiv.nextSibling);

        // Create text box
        var textBox = document.createElement('textarea');
        textBox.id = 'myTextBox';
        textBox.style.width = '100%';
        textBox.style.height = '200px';
        textBox.style.marginBottom = '10px';
        textBox.style.resize = 'vertical'; // 只能上下调整大小
        textBox.style.fontFamily = 'Microsoft Yahei';
        textBox.style.fontSize = '20px';
        container.appendChild(textBox);

        var viewNotesButton = document.createElement('button');
        viewNotesButton.textContent = '查看所有笔记';
        viewNotesButton.style.fontFamily = 'Microsoft Yahei';
        viewNotesButton.style.fontSize = '20px';
        viewNotesButton.style.marginBottom = '10px';
        container.appendChild(viewNotesButton);

        // Use flexbox to align items
        container.style.display = 'flex';
        container.style.flexDirection = 'column'; // 设置为列布局
        container.style.alignItems = 'flex-end'; // 将子元素对齐到右边

        // Load notes from local storage
        textBox.value = notes[pageID] || '';

        // Save notes to local storage
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

        // View all notes
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
            header.style.textAlign = 'center';
            header.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(header);

            var searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = '搜索笔记';
            searchInput.style.width = '100%';
            searchInput.style.marginBottom = '10px';
            searchInput.style.fontFamily = 'Microsoft Yahei';
            searchInput.style.border = '1px solid #ccc';
            searchInput.style.padding = '5px';
            notesList.appendChild(searchInput);

            var notesContainer = document.createElement('div');
            notesContainer.style.display = 'grid';
            notesContainer.style.gridTemplateColumns = '1fr 3fr 1fr';
            notesContainer.style.gap = '10px';
            notesContainer.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(notesContainer);

            // Export notes button
            var exportNotesButton = document.createElement('button');
            exportNotesButton.textContent = '导出笔记';
            exportNotesButton.style.position = 'absolute';
            exportNotesButton.style.top = '10px';
            exportNotesButton.style.left = '10px';
            exportNotesButton.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(exportNotesButton);

            // Import notes button
            var importNotesButton = document.createElement('button');
            importNotesButton.textContent = '导入笔记';
            importNotesButton.style.position = 'absolute';
            importNotesButton.style.top = '10px';
            importNotesButton.style.left = '100px';
            importNotesButton.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(importNotesButton);

            // Remove all notes button
            var clearNotesButton = document.createElement('button');
            clearNotesButton.textContent = '清空笔记';
            clearNotesButton.style.position = 'absolute';
            clearNotesButton.style.top = '10px';
            clearNotesButton.style.left = '190px';
            clearNotesButton.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(clearNotesButton);

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

            var paginationContainer = document.createElement('div');
            paginationContainer.style.display = 'flex';
            paginationContainer.style.justifyContent = 'center';
            paginationContainer.style.marginTop = '10px';
            paginationContainer.style.fontFamily = 'Microsoft Yahei';
            notesList.appendChild(paginationContainer);

            document.body.appendChild(notesList);

            var currentPage = 1;
            var notesPerPage = 10;
            var filteredNotes = Object.keys(notes).filter(id => notes[id].includes(''));
            // var filteredNotes = Object.keys(notes).filter(id => notes[id].includes('')).reverse();
            var maxVisiblePages = 7;

            function renderNotes(filter = '') {
                notesContainer.innerHTML = '';
                paginationContainer.innerHTML = '';
                filteredNotes = Object.keys(notes).filter(id => notes[id].includes(filter));
                var totalPages = Math.ceil(filteredNotes.length / notesPerPage);
            
                function createPageButton(page, text) {
                    let pageButton = document.createElement('button');
                    pageButton.textContent = text;
                    pageButton.style.margin = '0 5px';
                    pageButton.style.fontFamily = 'Microsoft Yahei';
                    pageButton.style.border = 'none'; // Remove border
                    if (page === currentPage) {
                        pageButton.disabled = true;
                        pageButton.style.fontWeight = 'bold';
                    } else {
                        pageButton.addEventListener('click', function() {
                            currentPage = page;
                            renderNotes(filter);
                        });
                    }
                    paginationContainer.appendChild(pageButton);
                }
            
                if (totalPages > 1) {
                    createPageButton(1, '首');
            
                    if (currentPage > 1) {
                        createPageButton(currentPage - 1, '<');
                    }
            
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
                    if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
            
                    for (let i = startPage; i <= endPage; i++) {
                        createPageButton(i, i);
                    }
            
                    if (currentPage < totalPages) {
                        createPageButton(currentPage + 1, '>');
                    }
            
                    createPageButton(totalPages, '末');
                }
            
                var start = (currentPage - 1) * notesPerPage;
                var end = start + notesPerPage;
                var notesToDisplay = filteredNotes.slice(start, end).reverse(); // Sort notes from newest to oldest
            
                for (var id of notesToDisplay) {
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
                    deleteButton.style.padding = '1px 1px';
                    deleteButton.style.fontWeight = 'bold';
                    deleteButton.addEventListener('click', function(id) {
                        return function() {
                            delete notes[id];
                            localStorage.setItem('notes', JSON.stringify(notes));
                            renderNotes(filter);
                        };
                    }(id));
                    notesContainer.appendChild(deleteButton);

                    // Add a horizontal rule between notes
                    // var hr = document.createElement('hr');
                    // hr.style.width = '100%';
                    // hr.style.border = 'none';
                    // hr.style.borderTop = '1px solid #ccc';
                    // hr.style.margin = '10px 0';
                    // notesContainer.appendChild(hr);
                }
            }

            searchInput.addEventListener('input', function() {
                currentPage = 1;
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

            function handleImportNotes() {
                var input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.style.display = 'none';
                input.addEventListener('change', function(event) {
                    var file = event.target.files[0];
                    if (file) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            try {
                                var importedNotes = JSON.parse(e.target.result);
                                // Merge imported notes with existing notes
                                notes = { ...notes, ...importedNotes };
                                localStorage.setItem('notes', JSON.stringify(notes));
                                alert('笔记导入成功！');
                            } catch (error) {
                                console.error('SkebMemo: Error parsing imported JSON.', error);
                                alert('导入失败，请检查文件格式是否正确。');
                            }
                        };
                        reader.readAsText(file);
                    }
                });
                input.click();
            }

            importNotesButton.addEventListener('click', handleImportNotes);

            clearNotesButton.addEventListener('click', function() {
                var confirmClear = confirm('确定要清空所有笔记吗？此操作不可恢复。');
                if (confirmClear) {
                    localStorage.removeItem('notes');
                    notes = {};
                    alert('所有笔记已清空。');
                    document.body.removeChild(notesList);
                }
            });
        });
    }

    function add_observer() {
        let body = document.body;
        let observer = new MutationObserver(mutations => {
            let targetDiv = document.querySelector('.is-box');
            if (targetDiv) {
                observer.disconnect();
                note_func();
            }
        });
        observer.observe(body, { childList: true, subtree: true });
    }

    add_observer();
})();
