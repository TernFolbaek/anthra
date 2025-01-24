import React, {useState, useCallback} from 'react';
import Modal from 'react-modal';
import Cropper from 'react-easy-crop';
import {Area} from 'react-easy-crop/types';
import './CropModal.css';

interface CropModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (croppedImage: Blob | null) => void;
}

const CropModal: React.FC<CropModalProps> = ({isOpen, imageSrc, onClose, onCropComplete}) => {
    const [crop, setCrop] = useState<{ x: number; y: number }>({x: 0, y: 0});
    const [zoom, setZoom] = useState<number>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImg = useCallback(async () => {
        if (!croppedAreaPixels || !imageSrc) return null;
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    }, [croppedAreaPixels, imageSrc]);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous'); // Needed to avoid CORS issues
            image.src = url;
        });

    const handleCrop = async () => {
        const croppedImage = await getCroppedImg();
        onCropComplete(croppedImage);
        onClose();
    };

    return (
        // @ts-ignore
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Crop Image"
            className="crop-modal"
            overlayClassName="crop-modal-overlay"
            ariaHideApp={false}
        >
            <div className="crop-container">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropCompleteHandler}
                />
            </div>
            <div className="crop-controls">
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="zoom-slider"
                />
                <div className="buttons">
                    <button onClick={onClose} className="cancel-button">
                        Cancel
                    </button>
                    <button onClick={handleCrop} className="crop-button bg-blue-500">
                        Crop
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CropModal;
