# Media Gift IPFS Implementation Guide

> Complete technical guide for implementing video and image gifts using IPFS-only decentralized storage

## 🎯 **OVERVIEW**

This document outlines how to implement media gifts (videos and images) in the GeoGift platform using pure IPFS storage. Recipients unlock GGT tokens plus bonus media content stored permanently on the decentralized web.

### **User Experience Flow:**
```
Creator uploads video/image → IPFS processing & storage → Gift creation → 
Recipient unlocks → Streams/downloads media from IPFS → Permanent access
```

---

## 🎥 **MEDIA GIFT USER JOURNEY**

### **📱 Creator Experience:**

**Step 1: Enhanced Gift Creation**
```typescript
const mediaGiftCreation = {
    1: 'Select "Enhanced Gift" option',
    2: 'Choose unlock type (GPS, riddle, password, etc.)',
    3: 'Upload video/image (drag & drop or file picker)',
    4: 'System processes media (compression, thumbnails)',
    5: 'Set GGT reward amount and message',
    6: 'Review gift with media preview',
    7: 'Create gift → uploads to IPFS → smart contract'
}
```

**Step 2: File Processing Pipeline**
```typescript
const processingSteps = {
    validation: 'Check file type, size (max 100MB)',
    compression: 'Create optimized versions for web',
    thumbnails: 'Generate preview images',
    chunking: 'Split large files for efficient upload',
    ipfsUpload: 'Upload all versions to IPFS network',
    pinning: 'Ensure permanent availability',
    giftCreation: 'Store IPFS hash in smart contract'
}
```

### **🎁 Recipient Experience:**

**Step 1: Gift Discovery**
```typescript
const claimingFlow = {
    1: 'Receive gift link (/gift/[id])',
    2: 'See thumbnail preview and gift details',
    3: 'Complete unlock challenge (GPS, riddle, etc.)',
    4: 'Claim GGT tokens from smart contract',
    5: 'IPFS media content unlocked and revealed',
    6: 'Stream video or view image directly',
    7: 'Download for permanent access'
}
```

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **1. Client-Side Media Processing**

**Image Processing Pipeline:**
```typescript
class ImageProcessor {
    async processImage(file: File): Promise<ImageVersions> {
        const img = await this.loadImage(file)
        
        return {
            // Original file for download
            original: file,
            
            // Compressed version for web viewing (800x600, 80% quality)
            preview: await this.createCompressedVersion(img, 800, 600, 0.8),
            
            // Small thumbnail for gift cards (200x200, 70% quality)
            thumbnail: await this.createThumbnail(img, 200, 200, 0.7),
            
            // Metadata for smart contracts and UI
            metadata: {
                originalSize: file.size,
                dimensions: { width: img.width, height: img.height },
                format: file.type,
                processedAt: new Date().toISOString()
            }
        }
    }
    
    private async createCompressedVersion(
        img: HTMLImageElement, 
        maxWidth: number, 
        maxHeight: number, 
        quality: number
    ): Promise<File> {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate optimal dimensions maintaining aspect ratio
        const { width, height } = this.calculateOptimalDimensions(
            img.width, img.height, maxWidth, maxHeight
        )
        
        canvas.width = width
        canvas.height = height
        
        // Draw image with high quality settings
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to optimized file
        return new Promise<File>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(new File([blob], `compressed_${Date.now()}.jpg`, { 
                    type: 'image/jpeg' 
                }))
            }, 'image/jpeg', quality)
        })
    }
    
    private calculateOptimalDimensions(
        originalWidth: number, 
        originalHeight: number, 
        maxWidth: number, 
        maxHeight: number
    ): { width: number; height: number } {
        const aspectRatio = originalWidth / originalHeight
        
        let width = maxWidth
        let height = maxHeight
        
        if (aspectRatio > 1) {
            // Landscape: width is limiting factor
            height = width / aspectRatio
            if (height > maxHeight) {
                height = maxHeight
                width = height * aspectRatio
            }
        } else {
            // Portrait: height is limiting factor
            width = height * aspectRatio
            if (width > maxWidth) {
                width = maxWidth
                height = width / aspectRatio
            }
        }
        
        return { width: Math.round(width), height: Math.round(height) }
    }
}
```

**Video Processing Pipeline:**
```typescript
class VideoProcessor {
    async processVideo(file: File): Promise<VideoVersions> {
        const video = await this.loadVideo(file)
        
        return {
            // Original file for full quality streaming
            original: file,
            
            // Thumbnail extracted from video frame
            thumbnail: await this.extractVideoThumbnail(video),
            
            // Optional: compressed preview (first 30 seconds)
            preview: await this.createVideoPreview(video, 30),
            
            // Rich metadata for UI and smart contracts
            metadata: {
                duration: video.duration,
                dimensions: { 
                    width: video.videoWidth, 
                    height: video.videoHeight 
                },
                size: file.size,
                format: file.type,
                bitrate: this.estimateBitrate(file.size, video.duration),
                processedAt: new Date().toISOString()
            }
        }
    }
    
    private async extractVideoThumbnail(video: HTMLVideoElement): Promise<File> {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Set thumbnail dimensions (16:9 aspect ratio)
        canvas.width = 320
        canvas.height = 180
        
        // Seek to an interesting frame (10% into video or 2 seconds)
        const seekTime = Math.min(2, video.duration * 0.1)
        video.currentTime = seekTime
        
        return new Promise<File>((resolve) => {
            video.onseeked = () => {
                // Draw video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                
                // Convert to JPEG thumbnail
                canvas.toBlob((blob) => {
                    resolve(new File([blob], 'video_thumbnail.jpg', { 
                        type: 'image/jpeg' 
                    }))
                }, 'image/jpeg', 0.8)
            }
        })
    }
    
    private loadVideo(file: File): Promise<HTMLVideoElement> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video')
            video.preload = 'metadata'
            
            video.onloadedmetadata = () => resolve(video)
            video.onerror = () => reject(new Error('Failed to load video'))
            
            video.src = URL.createObjectURL(file)
        })
    }
}
```

### **2. IPFS Upload System**

**Chunked Upload for Large Files:**
```typescript
class IPFSMediaUploader {
    private ipfsClient: IPFSHTTPClient
    private web3Storage: Web3Storage
    
    constructor() {
        this.ipfsClient = create({
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https',
            headers: {
                authorization: `Basic ${Buffer.from(
                    `${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_SECRET}`
                ).toString('base64')}`
            }
        })
        
        this.web3Storage = new Web3Storage({ 
            token: process.env.WEB3_STORAGE_TOKEN 
        })
    }
    
    async uploadMediaGift(mediaVersions: MediaVersions): Promise<IPFSMediaResult> {
        try {
            // 1. Upload each version with progress tracking
            const uploadResults = await this.uploadAllVersions(mediaVersions)
            
            // 2. Create organized directory structure
            const mediaDirectory = await this.createMediaDirectory(uploadResults)
            
            // 3. Pin all content for permanent availability
            await this.pinAllContent(uploadResults)
            
            // 4. Return organized result
            return {
                rootCID: mediaDirectory.cid,
                versions: {
                    original: uploadResults.original.cid,
                    preview: uploadResults.preview?.cid,
                    thumbnail: uploadResults.thumbnail.cid,
                    metadata: uploadResults.metadata.cid
                },
                totalSize: this.calculateTotalSize(mediaVersions),
                uploadedAt: new Date().toISOString()
            }
        } catch (error) {
            console.error('IPFS upload failed:', error)
            throw new Error(`Media upload failed: ${error.message}`)
        }
    }
    
    private async uploadAllVersions(mediaVersions: MediaVersions): Promise<UploadResults> {
        const uploadPromises = {
            // Large original file with chunking
            original: this.uploadWithChunking(
                mediaVersions.original, 
                'original',
                (progress) => this.onUploadProgress('original', progress)
            ),
            
            // Compressed preview (if exists)
            preview: mediaVersions.preview ? 
                this.uploadStandardFile(mediaVersions.preview, 'preview') : 
                Promise.resolve(null),
            
            // Small thumbnail
            thumbnail: this.uploadStandardFile(mediaVersions.thumbnail, 'thumbnail'),
            
            // Metadata JSON
            metadata: this.uploadJSON(mediaVersions.metadata, 'metadata')
        }
        
        const results = await Promise.allSettled(Object.values(uploadPromises))
        
        // Check for failures
        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length > 0) {
            throw new Error(`Upload failures: ${failures.map(f => f.reason).join(', ')}`)
        }
        
        return {
            original: results[0].value,
            preview: results[1].value,
            thumbnail: results[2].value,
            metadata: results[3].value
        }
    }
    
    private async uploadWithChunking(
        file: File, 
        label: string,
        onProgress?: (progress: number) => void
    ): Promise<IPFSUploadResult> {
        const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
        
        if (totalChunks === 1) {
            // Small file, upload normally
            return await this.uploadStandardFile(file, label)
        }
        
        // Large file, upload in chunks
        const chunkResults = []
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, file.size)
            const chunk = file.slice(start, end)
            
            const chunkResult = await this.ipfsClient.add(chunk, {
                progress: (bytes) => {
                    const overallProgress = ((i * CHUNK_SIZE + bytes) / file.size) * 100
                    onProgress?.(overallProgress)
                }
            })
            
            chunkResults.push(chunkResult)
        }
        
        // Combine chunks into single IPFS object
        const combinedResult = await this.ipfsClient.add({
            path: file.name,
            content: this.combineChunks(chunkResults)
        })
        
        return {
            cid: combinedResult.cid.toString(),
            size: combinedResult.size,
            path: combinedResult.path
        }
    }
    
    private async createMediaDirectory(uploadResults: UploadResults): Promise<IPFSUploadResult> {
        // Create IPFS directory structure
        const directoryContents = [
            {
                path: 'media/original',
                content: uploadResults.original.cid
            },
            {
                path: 'media/thumbnail.jpg',
                content: uploadResults.thumbnail.cid
            },
            {
                path: 'media/metadata.json',
                content: uploadResults.metadata.cid
            }
        ]
        
        // Add preview if it exists
        if (uploadResults.preview) {
            directoryContents.push({
                path: 'media/preview',
                content: uploadResults.preview.cid
            })
        }
        
        // Create directory manifest
        const manifest = {
            type: 'media_gift_directory',
            createdAt: new Date().toISOString(),
            contents: directoryContents.map(c => ({
                path: c.path,
                cid: c.content
            }))
        }
        
        directoryContents.push({
            path: 'media/manifest.json',
            content: JSON.stringify(manifest)
        })
        
        // Upload directory to IPFS
        const directoryResult = await this.ipfsClient.addAll(directoryContents, {
            wrapWithDirectory: true
        })
        
        // Return root directory CID
        const rootDirectory = directoryResult[directoryResult.length - 1]
        return {
            cid: rootDirectory.cid.toString(),
            size: rootDirectory.size,
            path: rootDirectory.path
        }
    }
    
    private async pinAllContent(uploadResults: UploadResults): Promise<void> {
        const cidsToPin = [
            uploadResults.original.cid,
            uploadResults.thumbnail.cid,
            uploadResults.metadata.cid
        ]
        
        if (uploadResults.preview) {
            cidsToPin.push(uploadResults.preview.cid)
        }
        
        // Pin on multiple services for redundancy
        const pinningPromises = cidsToPin.flatMap(cid => [
            this.ipfsClient.pin.add(cid),
            this.web3Storage.upload(new File([cid], 'pin')),
            this.pinToPinata(cid)
        ])
        
        await Promise.allSettled(pinningPromises)
    }
}
```

### **3. Smart Contract Integration**

**Enhanced Gift Structure for Media:**
```solidity
// Enhanced smart contract for media gifts
contract MediaGiftEscrow {
    struct MediaGift {
        address giver;
        address receiver;
        uint256 amount;
        UnlockType unlockType;
        bytes32 unlockDataHash;
        string ipfsMediaHash;     // Root IPFS hash containing all media
        MediaType mediaType;      // VIDEO, IMAGE, AUDIO
        bool claimed;
        uint256 expiry;
        uint256 createdAt;
    }
    
    enum UnlockType { GPS, RIDDLE, PASSWORD, DOCUMENT, VIDEO_CHALLENGE, IMAGE_CHALLENGE, URL }
    enum MediaType { VIDEO, IMAGE, AUDIO, DOCUMENT }
    
    mapping(uint256 => MediaGift) public mediaGifts;
    uint256 public nextGiftId;
    
    event MediaGiftCreated(
        uint256 indexed giftId,
        address indexed giver,
        address indexed receiver,
        uint256 amount,
        string ipfsHash,
        MediaType mediaType
    );
    
    event MediaGiftClaimed(
        uint256 indexed giftId,
        address indexed claimer,
        uint256 amount,
        string ipfsHash
    );
    
    function createMediaGift(
        address receiver,
        UnlockType unlockType,
        bytes32 unlockDataHash,
        string memory ipfsMediaHash,
        MediaType mediaType
    ) external payable returns (uint256) {
        require(msg.value > 0, "Gift amount must be greater than 0");
        require(bytes(ipfsMediaHash).length > 0, "IPFS hash required");
        
        uint256 giftId = nextGiftId++;
        
        mediaGifts[giftId] = MediaGift({
            giver: msg.sender,
            receiver: receiver,
            amount: msg.value,
            unlockType: unlockType,
            unlockDataHash: unlockDataHash,
            ipfsMediaHash: ipfsMediaHash,
            mediaType: mediaType,
            claimed: false,
            expiry: block.timestamp + 30 days,
            createdAt: block.timestamp
        });
        
        emit MediaGiftCreated(giftId, msg.sender, receiver, msg.value, ipfsMediaHash, mediaType);
        
        return giftId;
    }
    
    function claimMediaGift(
        uint256 giftId,
        bytes memory unlockProof
    ) external {
        MediaGift storage gift = mediaGifts[giftId];
        
        require(!gift.claimed, "Gift already claimed");
        require(block.timestamp < gift.expiry, "Gift expired");
        require(msg.sender == gift.receiver, "Not the intended receiver");
        
        // Verify unlock proof based on unlock type
        require(verifyUnlockProof(gift, unlockProof), "Invalid unlock proof");
        
        // Mark as claimed
        gift.claimed = true;
        
        // Transfer funds
        payable(gift.receiver).transfer(gift.amount);
        
        emit MediaGiftClaimed(giftId, msg.sender, gift.amount, gift.ipfsMediaHash);
    }
    
    function getMediaGift(uint256 giftId) external view returns (
        address giver,
        address receiver,
        uint256 amount,
        string memory ipfsMediaHash,
        MediaType mediaType,
        bool claimed,
        uint256 expiry
    ) {
        MediaGift storage gift = mediaGifts[giftId];
        return (
            gift.giver,
            gift.receiver,
            gift.amount,
            gift.ipfsMediaHash,
            gift.mediaType,
            gift.claimed,
            gift.expiry
        );
    }
}
```

### **4. Frontend Media Components**

**Media Upload Interface:**
```tsx
const MediaGiftUploader: React.FC = () => {
    const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'uploading' | 'complete'>('idle')
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    
    const handleFileUpload = async (file: File) => {
        try {
            setMediaFile(file)
            setUploadState('processing')
            
            // 1. Validate file
            validateMediaFile(file)
            
            // 2. Process media (compression, thumbnails)
            const processor = file.type.startsWith('video/') ? 
                new VideoProcessor() : new ImageProcessor()
            
            const mediaVersions = await processor.process(file)
            setMediaPreview(createPreview(mediaVersions))
            
            setUploadState('uploading')
            
            // 3. Upload to IPFS
            const ipfsUploader = new IPFSMediaUploader()
            const uploadResult = await ipfsUploader.uploadMediaGift(
                mediaVersions,
                (progress) => setUploadProgress(progress)
            )
            
            // 4. Create gift with media
            await createMediaGiftContract(uploadResult)
            
            setUploadState('complete')
            
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error(`Upload failed: ${error.message}`)
            setUploadState('idle')
        }
    }
    
    return (
        <div className="max-w-2xl mx-auto p-6">
            {uploadState === 'idle' && (
                <DropZone
                    onFilesDrop={([file]) => handleFileUpload(file)}
                    accept={{
                        'video/*': ['.mp4', '.webm', '.mov'],
                        'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                    }}
                    maxSize={100 * 1024 * 1024} // 100MB
                    maxFiles={1}
                >
                    <div className="text-center p-12 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Upload Media Gift
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Drag & drop a video or image, or click to browse
                        </p>
                        <p className="text-sm text-gray-400">
                            Supports MP4, WebM, JPG, PNG, GIF • Max 100MB
                        </p>
                    </div>
                </DropZone>
            )}
            
            {uploadState === 'processing' && (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium mb-2">Processing Media</h3>
                    <p className="text-gray-500">Creating optimized versions...</p>
                </div>
            )}
            
            {uploadState === 'uploading' && (
                <div className="p-8">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Uploading to IPFS</h3>
                            <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {mediaPreview && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-4">
                                <img 
                                    src={mediaPreview.thumbnail} 
                                    alt="Preview"
                                    className="w-16 h-16 object-cover rounded"
                                />
                                <div>
                                    <h4 className="font-medium">{mediaFile?.name}</h4>
                                    <p className="text-sm text-gray-500">
                                        {formatFileSize(mediaFile?.size || 0)} • 
                                        {mediaPreview.type === 'video' ? 'Video' : 'Image'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {uploadState === 'complete' && (
                <div className="text-center p-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                        Media Gift Created!
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Your media has been uploaded to IPFS and the gift is ready to share.
                    </p>
                    <Button onClick={() => navigateToGift()}>
                        View Gift
                    </Button>
                </div>
            )}
        </div>
    )
}
```

**Media Gift Viewing Interface:**
```tsx
const MediaGiftViewer: React.FC<{ giftId: string }> = ({ giftId }) => {
    const [giftData, setGiftData] = useState<MediaGiftData | null>(null)
    const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'streaming'>('loading')
    const [mediaUrl, setMediaUrl] = useState<string | null>(null)
    
    useEffect(() => {
        loadMediaGift()
    }, [giftId])
    
    const loadMediaGift = async () => {
        try {
            // 1. Load gift data from smart contract
            const contractData = await getMediaGiftFromContract(giftId)
            
            // 2. Load media metadata from IPFS
            const mediaData = await loadMediaFromIPFS(contractData.ipfsMediaHash)
            
            setGiftData({
                ...contractData,
                media: mediaData
            })
            
            setMediaState('ready')
            
        } catch (error) {
            console.error('Failed to load media gift:', error)
            toast.error('Failed to load gift')
            setMediaState('ready')
        }
    }
    
    const startMediaStreaming = async () => {
        if (!giftData) return
        
        try {
            setMediaState('streaming')
            
            // Get IPFS gateway URL for original media
            const streamingUrl = getOptimalIPFSGateway(giftData.media.versions.original)
            setMediaUrl(streamingUrl)
            
            // Preload in background for smoother experience
            if (giftData.media.type === 'video') {
                preloadVideo(streamingUrl)
            }
            
        } catch (error) {
            console.error('Failed to start streaming:', error)
            toast.error('Failed to load media')
            setMediaState('ready')
        }
    }
    
    const downloadMedia = async () => {
        if (!giftData || !mediaUrl) return
        
        try {
            // Create download from IPFS
            const response = await fetch(mediaUrl)
            const blob = await response.blob()
            
            // Trigger download
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = giftData.media.originalName || 'media_gift'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            
            toast.success('Download started!')
            
        } catch (error) {
            console.error('Download failed:', error)
            toast.error('Download failed')
        }
    }
    
    if (mediaState === 'loading') {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading from IPFS...</p>
                </div>
            </div>
        )
    }
    
    if (!giftData) {
        return (
            <div className="text-center p-12">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Gift Not Found</h3>
                <p className="text-gray-600">This media gift could not be loaded.</p>
            </div>
        )
    }
    
    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Gift Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            🎁 Media Gift
                        </h1>
                        <p className="text-gray-600">
                            {giftData.amount} ETH + {giftData.media.type} content
                        </p>
                    </div>
                    <Badge variant={giftData.claimed ? 'success' : 'default'}>
                        {giftData.claimed ? 'Claimed' : 'Available'}
                    </Badge>
                </div>
            </div>
            
            {/* Media Content */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                {mediaState === 'ready' && (
                    <div className="relative">
                        <img
                            src={getIPFSGatewayUrl(giftData.media.versions.thumbnail)}
                            alt="Media preview"
                            className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Button
                                size="lg"
                                onClick={startMediaStreaming}
                                className="bg-white text-black hover:bg-gray-100"
                            >
                                <Play className="w-6 h-6 mr-2" />
                                {giftData.media.type === 'video' ? 'Play Video' : 'View Image'}
                            </Button>
                        </div>
                    </div>
                )}
                
                {mediaState === 'streaming' && mediaUrl && (
                    <div>
                        {giftData.media.type === 'video' ? (
                            <video
                                src={mediaUrl}
                                controls
                                className="w-full h-auto"
                                poster={getIPFSGatewayUrl(giftData.media.versions.thumbnail)}
                                onError={() => toast.error('Video playback failed')}
                            >
                                <p>Your browser doesn't support video playback.</p>
                                <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                                    Download video instead
                                </a>
                            </video>
                        ) : (
                            <img
                                src={mediaUrl}
                                alt="Gift image"
                                className="w-full h-auto"
                                onError={() => toast.error('Image loading failed')}
                            />
                        )}
                        
                        <div className="p-4 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-medium">
                                    {giftData.media.originalName || 'Media Gift'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {formatFileSize(giftData.media.metadata.originalSize)} • 
                                    Stored permanently on IPFS
                                </p>
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={downloadMedia}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                                
                                <Button variant="outline" onClick={() => shareMediaGift(giftId)}>
                                    <Share className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Gift Details */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Gift Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">From:</span>
                        <p className="font-mono">{formatAddress(giftData.giver)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">To:</span>
                        <p className="font-mono">{formatAddress(giftData.receiver)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Created:</span>
                        <p>{formatDate(giftData.createdAt)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Expires:</span>
                        <p>{formatDate(giftData.expiry)}</p>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <Info className="w-4 h-4 inline mr-1" />
                        This media is stored permanently on IPFS and will remain accessible even if GeoGift goes offline.
                    </p>
                </div>
            </div>
        </div>
    )
}
```

---

## 🚀 **PERFORMANCE OPTIMIZATIONS**

### **1. Progressive Loading Strategy:**

```typescript
class ProgressiveMediaLoader {
    async loadMediaGift(giftId: string): Promise<void> {
        // Phase 1: Load thumbnail immediately (small, fast)
        const thumbnail = await this.loadThumbnail(giftId)
        this.displayThumbnail(thumbnail)
        
        // Phase 2: Load preview version (medium quality, faster than original)
        const preview = await this.loadPreview(giftId)
        this.displayPreview(preview)
        
        // Phase 3: Preload original in background (for instant playback)
        this.preloadOriginal(giftId)
        
        // Phase 4: Switch to original when user requests
        this.onUserRequest(() => this.displayOriginal(giftId))
    }
    
    private async loadThumbnail(giftId: string): Promise<string> {
        // Thumbnails are small, cache aggressively
        const cachedUrl = await this.cache.get(`thumbnail_${giftId}`)
        if (cachedUrl) return cachedUrl
        
        const url = await this.getIPFSUrl(giftId, 'thumbnail')
        await this.cache.set(`thumbnail_${giftId}`, url, { ttl: '7d' })
        return url
    }
    
    private async preloadOriginal(giftId: string): Promise<void> {
        // Start downloading original in background
        const url = await this.getIPFSUrl(giftId, 'original')
        
        // Use invisible link preload
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'video' // or 'image'
        link.href = url
        document.head.appendChild(link)
    }
}
```

### **2. Smart Gateway Selection:**

```typescript
class IPFSGatewayManager {
    private gateways = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.infura.io/ipfs/',
        'https://dweb.link/ipfs/'
    ]
    
    async getOptimalGateway(cid: string): Promise<string> {
        // Test multiple gateways simultaneously
        const racePromises = this.gateways.map(gateway => 
            this.testGatewaySpeed(gateway, cid)
        )
        
        try {
            // Return the first successful response
            const winner = await Promise.race(racePromises)
            return winner.url
        } catch {
            // Fallback to first gateway if all fail
            return this.gateways[0] + cid
        }
    }
    
    private async testGatewaySpeed(gateway: string, cid: string): Promise<{ url: string; speed: number }> {
        const url = gateway + cid
        const startTime = Date.now()
        
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                signal: AbortSignal.timeout(3000) // 3 second timeout
            })
            
            if (!response.ok) throw new Error('Gateway unavailable')
            
            const speed = Date.now() - startTime
            return { url, speed }
        } catch {
            throw new Error('Gateway failed')
        }
    }
}
```

### **3. Client-Side Caching:**

```typescript
class MediaCacheManager {
    private cache: Cache
    
    constructor() {
        this.initializeCache()
    }
    
    private async initializeCache(): Promise<void> {
        if ('caches' in window) {
            this.cache = await caches.open('geogift-media-v1')
        }
    }
    
    async getCachedMedia(cid: string, type: 'thumbnail' | 'preview' | 'original'): Promise<string | null> {
        if (!this.cache) return null
        
        try {
            const cacheKey = `${type}_${cid}`
            const cachedResponse = await this.cache.match(cacheKey)
            
            if (cachedResponse) {
                const blob = await cachedResponse.blob()
                return URL.createObjectURL(blob)
            }
            
            return null
        } catch {
            return null
        }
    }
    
    async cacheMedia(cid: string, type: 'thumbnail' | 'preview' | 'original', blob: Blob): Promise<void> {
        if (!this.cache) return
        
        try {
            const cacheKey = `${type}_${cid}`
            const response = new Response(blob)
            await this.cache.put(cacheKey, response)
        } catch (error) {
            console.warn('Failed to cache media:', error)
        }
    }
    
    // Cache management
    async clearExpiredCache(): Promise<void> {
        if (!this.cache) return
        
        const keys = await this.cache.keys()
        const now = Date.now()
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        
        for (const request of keys) {
            const response = await this.cache.match(request)
            const cachedDate = new Date(response.headers.get('date') || 0)
            
            if (now - cachedDate.getTime() > maxAge) {
                await this.cache.delete(request)
            }
        }
    }
}
```

---

## 💰 **COST ANALYSIS**

### **IPFS Storage Costs:**

```typescript
const mediaStorageCosts = {
    // File storage on IPFS
    pinataBasic: {
        cost: '$20/month',
        storage: '1GB',
        bandwidth: '1GB',
        features: ['Dedicated gateways', 'Analytics']
    },
    
    web3Storage: {
        cost: 'Free',
        storage: '1TB',
        bandwidth: 'Unlimited',
        features: ['Filecoin backing', 'Permanent storage']
    },
    
    infuraDedicated: {
        cost: '$50/month',
        storage: 'Unlimited',
        bandwidth: '10GB',
        features: ['Private IPFS node', 'Custom domain']
    }
}

// Cost per media gift
const costPerGift = {
    '10MB video': {
        storage: '$0.003/month',
        bandwidth: '$0.01 per 10 views',
        processing: 'Free (client-side)'
    },
    
    '5MB image': {
        storage: '$0.0015/month',
        bandwidth: '$0.005 per 10 views',
        processing: 'Free (client-side)'
    },
    
    averageCostPerGift: '$0.01 - $0.05 per month'
}
```

### **Revenue Potential:**

```typescript
const revenueAnalysis = {
    // Premium pricing for media gifts
    basicGift: '$5 - GPS unlock only',
    mediaGift: '$15 - GPS + video/image',
    premiumMediaGift: '$25 - Custom unlock + high-res media',
    
    // Margins
    costPerMediaGift: '$0.05',
    averagePrice: '$15',
    grossMargin: '99.7%',
    
    // Break-even analysis
    monthlyBreakEven: '2 media gifts to cover $40 IPFS costs',
    profitability: 'Highly profitable from day 1'
}
```

---

## 📋 **IMPLEMENTATION TIMELINE**

### **Phase 1: Media Processing Infrastructure (Week 1)**
**Days 1-2: Client-Side Processing**
- [ ] Build image compression and thumbnail generation
- [ ] Implement video thumbnail extraction
- [ ] Add file validation (type, size, format)
- [ ] Create progress tracking for processing

**Days 3-5: IPFS Upload System**
- [ ] Set up IPFS clients (Infura, Web3.Storage)
- [ ] Build chunked upload for large files
- [ ] Implement multi-version upload (original, preview, thumbnail)
- [ ] Add upload progress tracking and error handling

### **Phase 2: Smart Contract Integration (Week 2)**
**Days 1-3: Contract Development**
- [ ] Create MediaGiftEscrow smart contract
- [ ] Add support for IPFS hash storage
- [ ] Implement media type enumeration
- [ ] Add comprehensive event logging

**Days 4-5: Contract Testing**
- [ ] Write comprehensive test suite
- [ ] Test with various media types and sizes
- [ ] Validate IPFS integration
- [ ] Deploy to testnet and verify

### **Phase 3: Frontend Media Experience (Week 2-3)**
**Days 1-3: Upload Interface**
- [ ] Build drag-and-drop media uploader
- [ ] Create processing and upload progress UI
- [ ] Add media preview and metadata display
- [ ] Implement error handling and retry logic

**Days 4-7: Viewing Interface**
- [ ] Build media gift viewing components
- [ ] Implement progressive loading (thumbnail → preview → original)
- [ ] Add video streaming and image viewing
- [ ] Create download and sharing functionality

### **Phase 4: Performance Optimization (Week 3)**
**Days 1-3: Speed Optimizations**
- [ ] Implement smart IPFS gateway selection
- [ ] Add client-side caching with Service Workers
- [ ] Build progressive media loading system
- [ ] Optimize for mobile network conditions

**Days 4-5: Polish & UX**
- [ ] Add loading states and error handling
- [ ] Implement offline capability indicators
- [ ] Create comprehensive error recovery
- [ ] Test across different network conditions

### **Phase 5: Testing & Deployment (Week 3-4)**
**Days 1-2: Integration Testing**
- [ ] End-to-end testing with real media files
- [ ] Load testing with multiple concurrent uploads
- [ ] Cross-browser compatibility testing
- [ ] Mobile device testing

**Days 3-5: Production Deployment**
- [ ] Set up production IPFS infrastructure
- [ ] Deploy smart contracts to mainnet
- [ ] Configure monitoring and alerting
- [ ] Launch with beta user group

---

## ⚠️ **CHALLENGES & SOLUTIONS**

### **1. IPFS Gateway Reliability**

**Challenge:** Public IPFS gateways can be slow or unavailable
**Solutions:**
```typescript
const reliabilitySolutions = {
    multipleGateways: 'Race requests against 5+ gateways',
    dedicatedGateway: 'Use Pinata dedicated gateway for premium',
    fallbackChain: 'Graceful degradation through gateway list',
    healthMonitoring: 'Continuous gateway health checking',
    userFeedback: 'Clear loading states and error messages'
}
```

### **2. Large File Upload Times**

**Challenge:** 100MB videos take time to upload to IPFS
**Solutions:**
```typescript
const uploadOptimizations = {
    chunkedUpload: 'Break large files into 1MB chunks',
    parallelUpload: 'Upload chunks in parallel',
    progressTracking: 'Detailed progress indicators',
    backgroundUpload: 'Continue upload if user navigates away',
    resumableUpload: 'Resume interrupted uploads'
}
```

### **3. Mobile Performance**

**Challenge:** Large media files on slow mobile connections
**Solutions:**
```typescript
const mobileOptimizations = {
    adaptiveQuality: 'Serve lower quality on mobile/slow connections',
    wifiDetection: 'Auto-download only on WiFi',
    dataWarnings: 'Warn users about data usage',
    progressiveLoading: 'Load thumbnails first, full media on demand',
    compression: 'Aggressive compression for mobile previews'
}
```

### **4. Content Permanence**

**Challenge:** Ensuring media remains available long-term
**Solutions:**
```typescript
const permanenceSolutions = {
    multiProviderPinning: 'Pin on Web3.Storage + Pinata + self-hosted',
    incentivizedPinning: 'Pay for guaranteed pinning services',
    communityPinning: 'Encourage users to pin important content',
    migrationPlan: 'Strategy for moving to new storage if needed',
    backupArchival: 'Periodic backup to traditional storage'
}
```

---

## 🎯 **SUCCESS METRICS**

### **Technical KPIs:**
- [ ] **Upload Success Rate:** >99% for files under 50MB
- [ ] **Average Upload Time:** <30 seconds for 10MB files
- [ ] **Gateway Response Time:** <2 seconds for thumbnails
- [ ] **Content Availability:** >99.9% uptime for pinned content
- [ ] **Mobile Performance:** <5 seconds to display thumbnails

### **User Experience KPIs:**
- [ ] **Creation Completion Rate:** >85% start-to-finish
- [ ] **Media Engagement:** >70% recipients view full media
- [ ] **Download Rate:** >30% download for permanent access
- [ ] **User Satisfaction:** >4.5/5 rating for media gifts
- [ ] **Support Tickets:** <1% of media gifts require support

### **Business KPIs:**
- [ ] **Premium Adoption:** >40% choose media gifts over basic
- [ ] **Average Gift Value:** $15+ for media gifts vs $5 for basic
- [ ] **User Retention:** +25% return usage for media gift creators
- [ ] **Storage Costs:** <2% of gross revenue
- [ ] **Profit Margins:** >95% gross margin on media gifts

---

## 🚀 **CONCLUSION**

Media gifts with IPFS-only storage create a truly decentralized gifting experience that aligns perfectly with Web3 principles:

### **🌟 Key Benefits:**
- **Permanent Storage:** Content lives forever on IPFS
- **True Decentralization:** No reliance on traditional cloud providers
- **Global Availability:** Accessible from any IPFS gateway worldwide
- **Content Integrity:** Cryptographic verification of authenticity
- **Cost Efficiency:** ~$20-40/month covers significant usage

### **🎯 User Experience:**
- **Creators:** Simple drag-and-drop → automatic processing → permanent storage
- **Recipients:** Unlock challenge → instant streaming → permanent download access
- **Platform:** Premium pricing opportunity with high margins

### **⚡ Implementation Path:**
This system can be built in **3 weeks** by leveraging existing client-side processing, proven IPFS infrastructure, and smart contract patterns. The result is a cutting-edge media gifting platform that showcases the power of decentralized storage.

**Ready to build the future of media gifting? This implementation guide provides everything needed to create unforgettable video and image gift experiences on IPFS!** 🌟

---

*Last Updated: July 29, 2025*
*Document Version: 1.0*
*Implementation Status: Ready for Development*