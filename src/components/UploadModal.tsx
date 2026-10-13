import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  CameraOff,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Layers,
  Compass,
  Workflow,
  Building2,
  RefreshCw,
  RotateCcw,
  FlipHorizontal,
  ScanLine,
} from 'lucide-react';
import {
  SAMPLE_DIAGRAMS,
  FLOWCHART_SAMPLES,
  ARCHITECTURAL_SAMPLES,
  SampleTemplate,
} from '../utils/samples';
import { DiagramData } from '../types/flowchart';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (diagram: DiagramData, originalImageUrl: string) => void;
  initialMode?: 'flowchart' | 'architecture';
  initialTab?: 'upload' | 'camera';
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'flowchart',
  initialTab = 'upload',
}) => {
  const [studioMode, setStudioMode] = useState<'flowchart' | 'architecture'>(initialMode);
  const [inputTab, setInputTab] = useState<'upload' | 'camera'>(initialTab);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [fileName, setFileName] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isSnapping, setIsSnapping] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  };

  // Start WebRTC camera stream
  const startCameraStream = async (
    deviceId?: string,
    mode: 'user' | 'environment' = facingMode
  ) => {
    stopCameraStream();
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Live camera is not supported in this browser. Please upload an image file.');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: mode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsStartingCamera(false);

      // Enumerate available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      } catch (e) {
        // ignore enumeration issues
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Could not access camera. Please allow camera permissions or upload an image file.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. Please upload an image file or use the mobile camera.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application or tab.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
      setIsStartingCamera(false);
    }
  };

  // Capture current video frame into high-resolution JPEG
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual shutter flash
    setIsSnapping(true);
    setTimeout(() => setIsSnapping(false), 220);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setSelectedImage(dataUrl);
    setMimeType('image/jpeg');
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    setFileName(`Camera_Sketch_Snap_${timeStr}.jpg`);

    // Cleanly stop the camera after snapping photo
    stopCameraStream();
  };

  // Flip between front/rear camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(undefined, nextMode);
  };

  // Switch camera by device ID
  const handleSelectCameraDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCameraStream(deviceId);
  };

  // Sync mode and tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setStudioMode(initialMode || 'flowchart');
      setInputTab(initialTab || 'upload');
      setSelectedImage(null);
      setErrorMsg(null);
      setCameraError(null);

      if (initialTab === 'camera') {
        setTimeout(() => {
          startCameraStream();
        }, 150);
      }
    } else {
      stopCameraStream();
    }
  }, [isOpen, initialMode, initialTab]);

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Handle tab switch
  const handleSwitchTab = (tab: 'upload' | 'camera') => {
    setInputTab(tab);
    setErrorMsg(null);
    if (tab === 'camera') {
      if (!selectedImage) {
        startCameraStream();
      }
    } else {
      stopCameraStream();
    }
  };

  // Clipboard Paste support
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Loading steps animation
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  const isArch = studioMode === 'architecture';
  const activeSamples = isArch ? ARCHITECTURAL_SAMPLES : FLOWCHART_SAMPLES;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    setErrorMsg(null);
    setMimeType(file.type);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleTemplate) => {
    stopCameraStream();
    setSelectedImage(sample.thumbnailSvgUrl);
    setMimeType('image/svg+xml');
    setFileName(`${sample.title} (${isArch ? 'Blueprint Sample' : 'Sketch Sample'})`);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const endpoint = isArch ? '/api/analyze-architecture' : '/api/analyze-diagram';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          imageBase64: selectedImage,
          mimeType,
          userInstructions: instructions,
          additionalInstructions: instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze diagram');
      }

      const resData = await response.json();
      const analyzedDiagram: DiagramData = resData.diagram || resData;
      onSuccess(analyzedDiagram, selectedImage);
      onClose();
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'Error communicating with AI Vision model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isArch
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {isArch ? <Compass size={17} /> : <Sparkles size={16} className="text-amber-400" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>
                  {isArch
                    ? 'Civil & Architectural Sketch-to-CAD'
                    : 'AI Diagram & Sketch Reverse Engineering'}
                </span>
                {isArch && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    CAD Vision
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isArch
                  ? 'Snap a photo or upload rough sketches to generate 2D CAD blueprints'
                  : 'Snap a whiteboard photo or upload sketches to generate editable flowcharts'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* 1. Mode Switcher: Flowchart vs Architecture CAD */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setStudioMode('flowchart');
                setSelectedImage(null);
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isArch
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Workflow size={14} />
              <span>Flowchart & System Diagrams</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStudioMode('architecture');
                setSelectedImage(null);
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isArch
                  ? 'bg-slate-900 text-cyan-300 shadow-xs border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass size={14} className={isArch ? 'text-cyan-400' : ''} />
              <span>Architecture & CAD Blueprints</span>
            </button>
          </div>

          {/* 2. Input Source Selector: File Upload vs Live Camera Snap */}
          {!selectedImage && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  inputTab === 'upload'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload size={14} />
                <span>Upload File / Drag & Drop</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('camera')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  inputTab === 'camera'
                    ? isArch
                      ? 'bg-cyan-950 text-cyan-300 shadow-xs border border-cyan-500/30 font-bold'
                      : 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera size={14} className={inputTab === 'camera' ? 'text-amber-300' : 'text-amber-500'} />
                <span>Snap Photo with Camera</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 3. INPUT AREA (Camera Viewport OR Drag-and-Drop Dropzone) */}
          {!selectedImage ? (
            inputTab === 'camera' ? (
              /* =========================================================================
                 LIVE CAMERA CAPTURE VIEWPORT
                 ========================================================================= */
              <div className="flex flex-col gap-2.5">
                <div className="relative w-full aspect-video sm:h-[340px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Framing Guidelines Overlay */}
                  <div className="absolute inset-4 sm:inset-6 pointer-events-none border border-cyan-400/25 rounded-xl flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                    </div>
                    <div className="flex justify-center">
                      <span className="text-[10px] text-cyan-300/80 bg-slate-950/70 px-2 py-0.5 rounded-full border border-cyan-500/20 backdrop-blur-xs font-mono">
                        Frame rough paper sketch or whiteboard
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  </div>

                  {/* Top Header Bar Inside Camera */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-white text-[11px]">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-cyan-300">Live Camera</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Device switch / Flip button */}
                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 backdrop-blur-md cursor-pointer transition-colors"
                        title="Flip Camera (Front / Rear Environment)"
                      >
                        <FlipHorizontal size={14} className="text-cyan-400" />
                      </button>
                    </div>
                  </div>

                  {/* Shutter Flash Animation */}
                  {isSnapping && (
                    <div className="absolute inset-0 bg-white opacity-90 pointer-events-none transition-opacity duration-200" />
                  )}

                  {/* Camera Initializing Loader */}
                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs">
                      <Loader2 size={24} className="animate-spin text-cyan-400" />
                      <span>Initializing camera hardware...</span>
                    </div>
                  )}

                  {/* Camera Error State */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white gap-3">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                        <CameraOff size={24} />
                      </div>
                      <div className="max-w-sm">
                        <p className="font-bold text-sm text-rose-300 mb-1">Camera Not Available</p>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">{cameraError}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startCameraStream()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-600 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>Retry Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputTab('upload')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Upload size={13} />
                          <span>Upload File Instead</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Shutter Capture Button */}
                  {isCameraActive && !cameraError && (
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center pointer-events-auto">
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="group flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-full shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-cyan-400"
                        title="Capture Photo of Sketch"
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 animate-ping group-hover:bg-cyan-600" />
                        <span>Click to Snap Sketch</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Multiple Camera Device Selector Dropdown if available */}
                {availableCameras.length > 1 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Select Camera:</span>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => handleSelectCameraDevice(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs focus:outline-none"
                    >
                      {availableCameras.map((cam, i) => (
                        <option key={cam.deviceId || i} value={cam.deviceId}>
                          {cam.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* =========================================================================
                 DRAG & DROP UPLOAD DROPZONE
                 ========================================================================= */
              <div className="flex flex-col gap-2">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? isArch
                        ? 'border-cyan-500 bg-cyan-50/60 scale-[1.01]'
                        : 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                      : isArch
                      ? 'border-cyan-300/80 hover:border-cyan-500 hover:bg-cyan-50/40 bg-slate-50/30'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 bg-slate-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />

                  {/* Hidden Mobile Camera Input with native OS capture */}
                  <input
                    ref={mobileCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />

                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner ${
                      isArch
                        ? 'bg-cyan-100/80 text-cyan-700'
                        : 'bg-blue-100/70 text-blue-600'
                    }`}
                  >
                    {isArch ? <Building2 size={26} /> : <Upload size={26} />}
                  </div>

                  <p className="font-semibold text-slate-800 text-sm mb-1">
                    {isArch
                      ? 'Drag & drop floor plan sketch, paper blueprint, or civil drawing'
                      : 'Drag & drop your diagram, sketch, or whiteboard photo'}
                  </p>

                  <p className="text-xs text-slate-500 mb-3">
                    {isArch
                      ? 'Detects walls, swing doors, glazed windows, columns, room areas & dimensions'
                      : 'Supports PNG, JPG, WEBP, SVG • Or paste with Ctrl + V'}
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        isArch
                          ? 'text-cyan-700 bg-cyan-50 border-cyan-200/80 hover:bg-cyan-100'
                          : 'text-blue-600 bg-blue-50 border-blue-200/60 hover:bg-blue-100'
                      }`}
                    >
                      Browse Files
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitchTab('camera');
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera size={13} className="text-amber-600" />
                      <span>Take Photo with Camera</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* =========================================================================
               CAPTURED / SELECTED IMAGE PREVIEW CARD
               ========================================================================= */
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-18 h-18 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs relative">
                  <img
                    src={selectedImage}
                    alt="Captured Sketch Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-1 left-1 bg-slate-900/80 text-white p-0.5 rounded text-[8px] font-bold">
                    <Camera size={9} className="text-cyan-400" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-800 truncate">
                    {fileName || (isArch ? 'Floor Plan Sketch' : 'Captured Rough Sketch')}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>
                      {isArch
                        ? 'Photo ready for architectural CAD reverse engineering'
                        : 'Photo ready for flowchart reverse engineering'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    handleSwitchTab('camera');
                  }}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Retake photo using camera"
                >
                  <RotateCcw size={12} />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Quick Preset Samples to try right away */}
          {!selectedImage && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Layers size={13} />
                <span>
                  {isArch
                    ? 'Or test with a sample architectural sketch'
                    : 'Or test with a sample sketch'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {activeSamples.slice(0, 3).map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/20 transition-all group cursor-pointer"
                  >
                    <div className="h-16 rounded-lg bg-slate-100 mb-2 overflow-hidden border border-slate-100 flex items-center justify-center">
                      <img
                        src={sample.thumbnailSvgUrl}
                        alt={sample.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {sample.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Guidance / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isArch ? 'Drafting Guidance for Civil AI (Optional)' : 'Optional Instructions for AI'}
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={
                isArch
                  ? 'e.g. Include attached bathrooms, 9" exterior walls, vitrified tile notes, North-facing entry'
                  : 'e.g. Include diamond decision branches, group by backend services, etc.'
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>

          {/* Loading Animation Status */}
          {isLoading && (
            <div
              className={`p-4 rounded-xl space-y-2 border ${
                isArch
                  ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2">
                  <Loader2
                    size={14}
                    className={`animate-spin ${isArch ? 'text-cyan-600' : 'text-blue-600'}`}
                  />
                  <span>
                    {isArch
                      ? 'Analyzing Architectural Floor Plan with Gemini Vision CAD...'
                      : 'Analyzing Diagram with Flowlify Vision AI...'}
                  </span>
                </span>
                <span>{Math.min(100, (loadingStep + 1) * 30)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isArch ? 'bg-cyan-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, (loadingStep + 1) * 33)}%` }}
                />
              </div>
              <p className={`text-[11px] ${isArch ? 'text-cyan-800' : 'text-blue-700'}`}>
                {isArch ? (
                  <>
                    {loadingStep === 0 && 'Scanning blueprint contours, wall boundaries, and scale lines...'}
                    {loadingStep === 1 && 'Detecting room enclosures, swing doors, and window openings...'}
                    {loadingStep === 2 && 'Measuring room square meters / sq ft and structural column grid...'}
                    {loadingStep >= 3 && 'Synthesizing orthogonal CAD blueprint drawing...'}
                  </>
                ) : (
                  <>
                    {loadingStep === 0 && 'Scanning diagram lines, shapes, and contours...'}
                    {loadingStep === 1 && 'Detecting nodes, database blocks, and text labels...'}
                    {loadingStep === 2 && 'Mapping edge connections, decisions, and directions...'}
                    {loadingStep >= 3 && 'Synthesizing responsive editable flowchart graph...'}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!selectedImage || isLoading}
            className={`flex items-center gap-2 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer ${
              isArch
                ? 'bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 hover:from-slate-800 hover:to-blue-900 border border-cyan-500/40 text-cyan-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isArch ? 'Generating CAD Blueprint...' : 'Generating Flowchart...'}</span>
              </>
            ) : (
              <>
                <span>
                  {isArch ? 'Convert to Editable CAD Blueprint' : 'Convert to Editable Flowchart'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
