'use client';

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
    file: File;
    onCrop: (blob: Blob) => void;
    onCancel: () => void;
    aspect?: number;
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function ImageCropper({ file, onCrop, onCancel, aspect = 1 }: ImageCropperProps) {
    const [crop, setCrop] = useState<Crop>();
    const [imgSrc, setImgSrc] = useState<string>('');
    const imgRef = useRef<HTMLImageElement>(null);

    // Load image when file changes
    useEffect(() => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImgSrc(reader.result?.toString() || '');
        });
        reader.readAsDataURL(file);
    }, [file]);

    // Set initial crop when image loads
    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const crop = centerAspectCrop(width, height, aspect);
        setCrop(crop);
    }

    const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 1);
        });
    };

    const handleCropComplete = async () => {
        if (!imgRef.current || !crop) return;

        try {
            const croppedBlob = await getCroppedImg(imgRef.current, crop as PixelCrop);
            onCrop(croppedBlob);
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => onCancel()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                    <DialogDescription>
                        Adjust the crop area to select your profile picture
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCrop(c)}
                            aspect={aspect}
                            circularCrop
                        >
                            <img
                                ref={imgRef}
                                src={imgSrc}
                                alt="Crop me"
                                style={{ maxHeight: '400px' }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    )}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleCropComplete}>
                        Apply
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 