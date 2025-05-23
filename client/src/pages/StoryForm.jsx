import React, { useState } from "react";
import axios from "axios";

const StoryForm = ({ onSubmitSuccess }) => {
  const [storyData, setStoryData] = useState({
    title: "",
    author: "",
    storyBody: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [media, setMedia] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setMedia(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      console.log("Preview URL:", previewUrl);
      setPreviewMedia(previewUrl);
    } else {
      setPreviewMedia(null);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();

      formData.append("title", storyData.title);
      formData.append("author", storyData.author);
      formData.append("storyBody", storyData.storyBody);
      formData.append("tags", JSON.stringify(tags));

      if (media) {
        formData.append("media", media);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_ADMIN_API_URL}/admin/write/stories`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("story posted successfully:", response.data);
      alert("Story posted successfully!");

      // Create a story object to pass back to parent
      const newStory = response.data.story || {
        ...storyData,
        _id: Date.now(), // Temporary ID if the backend doesn't return an ID
        tags,
        mediaUrl: previewMedia,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage for fallback display
      try {
        // Get existing stories from localStorage or initialize empty array
        const existingStories = JSON.parse(localStorage.getItem('createdStories') || '[]');
        // Add the new story
        existingStories.unshift(newStory); // Add to beginning of array
        // Save back to localStorage
        localStorage.setItem('createdStories', JSON.stringify(existingStories));
        console.log("Story saved to localStorage for fallback display");
      } catch (err) {
        console.error("Could not save story to localStorage:", err);
      }

      // Pass the story data to parent component
      if (onSubmitSuccess) {
        onSubmitSuccess(newStory);
      }

      setStoryData({
        title: "",
        author: "",
        storyBody: "",
      });
      setTags([]);
      setTagInput("");
      setMedia(null);
      setPreviewMedia(null);
    } catch (error) {
      console.log("Something went wrong!", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-md p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-6"
        encType="multipart/form-data"
      >
        {/* Story Title */}
        <div>
          <label className="text-lg font-medium text-gray-700">
            Story Title
          </label>
          <input
            type="text"
            name="title"
            value={storyData.title}
            onChange={handleInputChange}
            placeholder="Enter story title"
            required
            className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Author */}
        <div>
          <label className="text-lg font-medium text-gray-700">Author</label>
          <input
            type="text"
            name="author"
            value={storyData.author}
            onChange={handleInputChange}
            placeholder="Your name or alias"
            required
            className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tags Input */}
        <div>
          <label className="text-lg font-medium text-gray-700">Tags</label>
          <div className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-2 text-blue-600 hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Press Enter to add tag"
                className="flex-grow min-w-[120px] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Story Body */}
        <div>
          <label className="text-lg font-medium text-gray-700">Story</label>
          <textarea
            name="storyBody"
            value={storyData.storyBody}
            onChange={handleInputChange}
            placeholder="Write your story here..."
            rows="6"
            required
            className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Media Upload (optional) */}
        <div>
          <label className="text-lg font-medium text-gray-700">
            Upload Image/Video (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              name="media"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="w-full p-3 mt-2 border border-gray-300 rounded-lg pl-12"
            />
            <img
              src="/icons/upload.svg"
              alt="Upload Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6"
            />
          </div>
          {previewMedia && (
            <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden w-full max-w-md">
              {media?.type?.startsWith("video") ? (
                <video
                  key={previewMedia}
                  controls
                  src={previewMedia}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <img
                  key={previewMedia}
                  src={previewMedia}
                  alt="Media Preview"
                  className="w-full h-auto object-cover"
                />
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-6 bg-primary-100 text-white font-semibold rounded-lg shadow-md hover:bg-primary-100/80 focus:outline-none focus:ring-2"
        >
          Upload Story
        </button>
      </form>
    </div>
  );
};

export default StoryForm;