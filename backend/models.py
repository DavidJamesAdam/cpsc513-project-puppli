from pydantic import BaseModel, EmailStr, field_validator, Field

import re

COMMON_PASSWORDS = {"password", "12345678", "qwerty", "letmein"}


class User(BaseModel):
  email: EmailStr = Field(...)
  password: str
  displayName: str = Field(..., min_length=1)
  cityName: str = Field(..., min_length=1)
  provinceName: str = Field(..., min_length=1)

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

class UserInfo(BaseModel):
  email: EmailStr
  displayName: str
  cityName: str
  provinceName: str

class UpdateUser(BaseModel):
  displayName: str | None = None
  bio: str | None = None
  provinceName: str | None = None
  cityName: str | None = None

class PostCreate(BaseModel):
  caption: str
  petId: str
  cityName: str
  provinceName: str

class PostInfo(BaseModel):
  caption: str
  imageUrl: str
  favouriteCount: int
  voteCount: int


class CommentCreate(BaseModel):
  text: str = Field(..., max_length=56)


class PetCreate(BaseModel):
  name: str = Field(..., min_length=1)
  breed: str = Field(..., min_length=1)
  birthday: str = Field(...)
  favouriteToy: str = Field(..., min_length=1)
  favouriteTreat: str = Field(..., min_length=1)


class PetInfo(BaseModel):
  id: str
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
