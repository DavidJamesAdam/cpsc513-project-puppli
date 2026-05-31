from pydantic import BaseModel, EmailStr, field_validator, Field
import re

COMMON_PASSWORDS = {"password", "12345678", "qwerty", "letmein"}


class User(BaseModel):
  email: EmailStr
  password: str
  displayName: str | None = None
  cityName: str
  provinceName: str

  # Password Validation
  @field_validator("password")
  def validate_password(cls, v: str) -> str:
    if len(v) < 8:
      raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Z]", v):
      raise ValueError("Password must contain an uppercase letter")
    if not re.search(r"[a-z]", v):
      raise ValueError("Password must contain a lowercase letter")
    if not re.search(r"[0-9]", v):
      raise ValueError("Password must contain a digit")
    if not re.search(r"[^A-Za-z0-9]", v):
      raise ValueError("Password must contain a symbol")
    if v.lower() in COMMON_PASSWORDS:
      raise ValueError("Password is too common")
    return v

class UpdateUser(BaseModel):
  displayName: str | None = None
  bio: str | None = None
  provinceName: str | None = None
  cityName: str | None = None

class PostCreate(BaseModel):
  caption: str
  petId: str
  imageUrl: str


class CommentCreate(BaseModel):
  text: str = Field(..., max_length=56)


class PetCreate(BaseModel):
  name: str
  breed: str
  birthday: str
  favouriteToy: str
  favouriteTreat: str


class UpdatePet(BaseModel):
  name: str | None = None
  breed: str | None = None,
  birthday: str | None = None,
  favouriteToy: str | None = None,
  favouriteTreat: str | None = None


class EmailUpdate(BaseModel):
  new_email: EmailStr


class PassUpdate(BaseModel):
  new_password: str

  # Password Validation
  @field_validator("new_password")
  def validate_password(cls, v: str) -> str:
    if len(v) < 8:
      raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Z]", v):
      raise ValueError("Password must contain an uppercase letter")
    if not re.search(r"[a-z]", v):
      raise ValueError("Password must contain a lowercase letter")
    if not re.search(r"[0-9]", v):
      raise ValueError("Password must contain a digit")
    if not re.search(r"[^A-Za-z0-9]", v):
      raise ValueError("Password must contain a symbol")
    if v.lower() in COMMON_PASSWORDS:
      raise ValueError("Password is too common")
    return v
