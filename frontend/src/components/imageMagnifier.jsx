import { Box, Image } from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";

const ImageMagnifier = ({ src, alt }) => {
  const imgRef = useRef(null);

  const [showLens, setShowLens] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const lensSize = 120;
  const zoom = 2.5;

  // ✅ Capture image size AFTER render
  useEffect(() => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.offsetWidth,
        height: imgRef.current.offsetHeight,
      });
    }
  }, [src]);

  const handleMove = (e) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // 🔒 Clamp inside image
    x = Math.max(lensSize / 2, Math.min(x, rect.width - lensSize / 2));
    y = Math.max(lensSize / 2, Math.min(y, rect.height - lensSize / 2));

    setPos({ x, y });
  };

  return (
    <Box
      position="relative"
      overflow="hidden"
      onMouseEnter={() => setShowLens(true)}
      onMouseLeave={() => setShowLens(false)}
      onMouseMove={handleMove}
      onTouchStart={() => setShowLens(true)}
      onTouchMove={handleMove}
      onTouchEnd={() => setShowLens(false)}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        w="100%"
        borderRadius="md"
        objectFit="cover"
        onLoad={() => {
          if (imgRef.current) {
            setImgSize({
              width: imgRef.current.offsetWidth,
              height: imgRef.current.offsetHeight,
            });
          }
        }}
      />

      {showLens && imgSize.width > 0 && (
        <Box
          position="absolute"
          pointerEvents="none"
          top={`${pos.y - lensSize / 2}px`}
          left={`${pos.x - lensSize / 2}px`}
          w={`${lensSize}px`}
          h={`${lensSize}px`}
          border="2px solid gray"
          borderRadius="md"
          backgroundImage={`url(${src})`}
          backgroundRepeat="no-repeat"
          backgroundSize={`${imgSize.width * zoom}px ${
            imgSize.height * zoom
          }px`}
          backgroundPosition={`
            ${-(pos.x * zoom - lensSize / 2)}px
            ${-(pos.y * zoom - lensSize / 2)}px
          `}
        />
      )}
    </Box>
  );
};

export default ImageMagnifier;
