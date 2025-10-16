document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-upload');
    const addMoreFileInput = document.getElementById('add-more-file-upload');
    const addMoreContainer = document.getElementById('add-more-container');
    const formatSelect = document.getElementById('format-select');
    const convertBtn = document.getElementById('convert-btn');
    const animateBtn = document.getElementById('animate-btn');
    const gifAnimationControls = document.getElementById('gif-animation-controls');
    const gifLoopCheckbox = document.getElementById('gif-loop');
    const gifDelaySelect = document.getElementById('gif-delay');
    const downloadLink = document.getElementById('download-link');
    const imagePreview = document.getElementById('image-preview');
    const converterControls = document.getElementById('converter-controls');
    const outputSection = document.getElementById('output-section');
    const canvas = document.getElementById('conversion-canvas');
    const ctx = canvas.getContext('2d');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageCloseBtn = document = document.getElementById('message-close-btn');

    const fileInfoContainer = document.getElementById('file-info');
    const fileList = document.getElementById('file-list');

    let uploadedFiles = [];

    const showMessage = (message) => {
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
    };

    messageCloseBtn.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });

    const updateFileInfo = () => {
        fileList.innerHTML = '';
        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach((file, index) => {
                const li = document.createElement('li');
                const fileSizeKB = (file.size / 1024).toFixed(2);
                li.className = 'text-sm text-gray-600 flex justify-between items-center';
                li.innerHTML = `
                    <div class="truncate">
                        <span class="font-medium">Name:</span> ${file.name}, 
                        <span class="font-medium">Size:</span> ${fileSizeKB} KB, 
                        <span class="font-medium">Type:</span> ${file.type}
                    </div>
                    <button class="ml-4 text-red-500 hover:text-red-700 transition duration-300 ease-in-out" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                `;
                fileList.appendChild(li);
            });
            fileInfoContainer.classList.remove('hidden');
        } else {
            fileInfoContainer.classList.add('hidden');
        }

        // Add event listeners to the new remove buttons
        document.querySelectorAll('#file-list button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                uploadedFiles.splice(index, 1);
                updateFileInfo();
                toggleGifControls();
                if (uploadedFiles.length === 0) {
                    converterControls.classList.add('hidden');
                    addMoreContainer.classList.add('hidden');
                    outputSection.classList.add('hidden');
                }
            });
        });
    };

    const handleFileChange = (e, isMultiple) => {
        const files = isMultiple ? Array.from(e.target.files) : Array.from(e.target.files);
        if (files.length > 0) {
            uploadedFiles = uploadedFiles.concat(files);
            updateFileInfo();
            
            converterControls.classList.remove('hidden');
            addMoreContainer.classList.remove('hidden');
            outputSection.classList.add('hidden');
            downloadLink.href = '#';
            imagePreview.src = '#';
            
            // Show GIF animation controls if needed
            toggleGifControls();
        }
    };

    const toggleGifControls = () => {
        const selectedFormat = formatSelect.value;
        const isGifSelected = selectedFormat === 'image/gif';
        const isMultipleImages = uploadedFiles.length > 1;

        if (isGifSelected && uploadedFiles.length === 1) {
            showMessage('This GIF will be static. To animate, add more than one image.');
        }

        if (isGifSelected && isMultipleImages) {
            convertBtn.classList.add('hidden');
            gifAnimationControls.classList.remove('hidden');
        } else {
            convertBtn.classList.remove('hidden');
            gifAnimationControls.classList.add('hidden');
        }
    };

    fileInput.addEventListener('change', (e) => handleFileChange(e, false));
    addMoreFileInput.addEventListener('change', (e) => handleFileChange(e, true));

    formatSelect.addEventListener('change', toggleGifControls);

    convertBtn.addEventListener('click', () => {
        if (uploadedFiles.length === 0) {
            showMessage('Please upload an image first.');
            return;
        }

        const selectedFormat = formatSelect.value;
        outputSection.classList.add('hidden');
        imagePreview.src = '#';
        downloadLink.href = '#';

        // Handle conversions using the native canvas method
        const file = uploadedFiles[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                const fileExtension = selectedFormat.split('/')[1];
                const convertedDataUrl = canvas.toDataURL(selectedFormat);
                
                imagePreview.src = convertedDataUrl;
                downloadLink.href = convertedDataUrl;
                downloadLink.download = `converted-image.${fileExtension}`;

                outputSection.classList.remove('hidden');
                showMessage('Conversion completed successfully!');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    animateBtn.addEventListener('click', () => {
        if (uploadedFiles.length < 2) {
            showMessage('Please upload at least two images to create an animated GIF.');
            return;
        }
        
        showMessage('Creating animated GIF...');

        const delay = parseInt(gifDelaySelect.value, 10);
        const loop = gifLoopCheckbox.checked;

        const gif = new GIF({
            workers: 2,
            quality: 10,
            workerScript: 'gif.worker.js',
            repeat: loop ? 0 : -1,
            transparent: null // Or any color you want to make transparent
        });

        let loadedCount = 0;
        uploadedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    gif.addFrame(img, { delay: delay });
                    loadedCount++;
                    if (loadedCount === uploadedFiles.length) {
                        gif.render();
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        gif.on('finished', (blob) => {
            const convertedDataUrl = URL.createObjectURL(blob);
            imagePreview.src = convertedDataUrl;
            downloadLink.href = convertedDataUrl;
            downloadLink.download = `animated-image.gif`;
            outputSection.classList.remove('hidden');
            showMessage('Animated GIF creation completed successfully!');
        });

        gif.on('progress', (p) => {
             // You could show a progress bar here
             console.log(`GIF rendering progress: ${Math.round(p * 100)}%`);
        });
    });
    
    // Add event listener to the download link
    downloadLink.addEventListener('click', () => {
        showMessage('Download started!');
    });
});

