import cloudinary
import cloudinary.uploader
from ..config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


async def upload_image(image_data: bytes, filename: str, folder: str = "crop_analyses") -> dict:
    """Upload image to Cloudinary and return URL and public_id."""
    result = cloudinary.uploader.upload(
        image_data,
        folder=folder,
        public_id=filename.rsplit(".", 1)[0],
        overwrite=True,
        resource_type="image",
        transformation=[
            {"quality": "auto:good"},
            {"fetch_format": "auto"},
        ],
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


async def delete_image(public_id: str):
    """Delete image from Cloudinary."""
    cloudinary.uploader.destroy(public_id)
