const projectDialog = document.querySelector(".project-dialog");
const projectDialogTitle = document.querySelector("#project-dialog-title");
const projectDialogContent = document.querySelector(".project-dialog-content");
const projectDialogClose = document.querySelector(".project-dialog-close");
const mediaViewer = document.querySelector(".media-viewer");
const mediaViewerContent = document.querySelector(".media-viewer-content");
const mediaViewerClose = document.querySelector(".media-viewer-close");
const colorSwatches = document.querySelectorAll(".color-swatch");
let sectionScrollFrame;

function scrollToSection(target) {
    if (sectionScrollFrame) {
        cancelAnimationFrame(sectionScrollFrame);
    }

    const start = window.scrollY;
    const distance = target.getBoundingClientRect().top;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : Math.min(1600, Math.max(700, Math.abs(distance) * 0.35));

    if (!duration || Math.abs(distance) < 1) {
        window.scrollTo(0, start + distance);
        return;
    }

    let startTime;
    const animateScroll = (time) => {
        startTime ??= time;
        const progress = Math.min((time - startTime) / duration, 1);
        const easedProgress = progress < 0.5
            ? 4 * progress ** 3
            : 1 - ((-2 * progress + 2) ** 3) / 2;
        window.scrollTo(0, start + distance * easedProgress);

        if (progress < 1) {
            sectionScrollFrame = requestAnimationFrame(animateScroll);
        } else {
            sectionScrollFrame = undefined;
        }
    };

    sectionScrollFrame = requestAnimationFrame(animateScroll);
}

document.querySelectorAll(".navbar a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if (!target) {
            return;
        }

        event.preventDefault();
        if (window.location.hash !== link.hash) {
            window.history.pushState(null, "", link.hash);
        }
        scrollToSection(target);
    });
});

colorSwatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
        const theme = swatch.dataset.theme;
        document.documentElement.dataset.theme = theme;
        colorSwatches.forEach((item) => {
            item.setAttribute("aria-pressed", String(item === swatch));
        });
    });
});

function updatePageScrollLock() {
    const modalIsOpen = projectDialog.open || mediaViewer.open;
    document.documentElement.classList.toggle("modal-open", modalIsOpen);
    document.body.classList.toggle("modal-open", modalIsOpen);
}

function createMediaViewerButton(src, type, label) {
    const button = document.createElement("button");
    button.className = "media-viewer-trigger";
    button.type = "button";
    button.dataset.mediaSrc = src;
    button.dataset.mediaType = type;
    button.setAttribute("aria-label", `Agrandir : ${label}`);
    return button;
}

function openMediaViewer(src, type, label) {
    mediaViewerContent.replaceChildren();
    const media = document.createElement(type);
    if (type === "video") {
        media.controls = true;
        media.playsInline = true;
        media.autoplay = false;
        media.preload = "metadata";
        media.src = src;
    } else {
        media.src = src;
        media.alt = label;
    }
    mediaViewerContent.append(media);
    if (type === "video") {
        media.load();
    }
    mediaViewer.showModal();
    updatePageScrollLock();
}

document.querySelectorAll(".project-card").forEach((card) => {
    const openButton = document.createElement("button");
    openButton.className = "project-open-button";
    openButton.type = "button";
    openButton.textContent = "Voir les détails";
    const projectTitle = card.querySelector(".project-title");
    const heading = document.createElement("div");
    heading.className = "project-card-heading";
    projectTitle.before(heading);
    heading.append(projectTitle, openButton);

    openButton.addEventListener("click", () => {
        const title = card.querySelector(".project-title h3");
        projectDialogTitle.textContent = title.textContent.trim();
        projectDialogContent.replaceChildren();

        const overview = document.createElement("div");
        overview.className = "project-dialog-overview";
        const imageColumn = document.createElement("div");
        imageColumn.className = "project-dialog-image-column";
        const introductionColumn = document.createElement("div");
        introductionColumn.className = "project-dialog-introduction-column";

        const image = card.querySelector(".project-image img");
        if (image) {
            const imageContainer = createMediaViewerButton(
                image.currentSrc || image.src,
                "img",
                image.alt || title.textContent.trim(),
            );
            imageContainer.className = "project-image";
            imageContainer.classList.add("media-viewer-trigger");
            imageContainer.append(image.cloneNode());
            imageColumn.append(imageContainer);
        }

        const extendedDetails = card.querySelector(".project-modal-details");
        let remainingDetails;
        if (extendedDetails) {
            const detailsCopy = extendedDetails.cloneNode(true);
            detailsCopy.removeAttribute("hidden");
            const introduction = detailsCopy.querySelector("section");
            if (introduction) {
                introduction.classList.add("project-dialog-introduction");
                introductionColumn.append(introduction);
            }
            if (detailsCopy.childElementCount) {
                remainingDetails = detailsCopy;
            }
        }

        if (imageColumn.childElementCount) {
            overview.append(imageColumn);
        }
        if (introductionColumn.childElementCount) {
            overview.append(introductionColumn);
        }
        if (overview.childElementCount) {
            projectDialogContent.append(overview);
        }

        if (remainingDetails) {
            projectDialogContent.append(remainingDetails);
        }

        const videoPaths = (card.dataset.videos || card.dataset.video || "")
            .split("|")
            .map((path) => path.trim())
            .filter(Boolean);
        if (videoPaths.length) {
            const videoSection = document.createElement("section");
            videoSection.className = "project-video-section";
            const videoHeading = document.createElement("h3");
            videoHeading.textContent = videoPaths.length > 1
                ? "Présentations vidéo"
                : "Présentation vidéo";
            const videoGrid = document.createElement("div");
            videoGrid.className = "project-video-grid";

            videoPaths.forEach((videoPath, index) => {
                const videoLabel = `Présentation vidéo ${index + 1} de ${title.textContent.trim()}`;
                const videoItem = document.createElement("div");
                videoItem.className = "project-video-item";
                const video = document.createElement("video");
                video.controls = true;
                video.playsInline = true;
                video.preload = "metadata";
                video.setAttribute("aria-label", videoLabel);
                video.src = videoPath;
                const expandButton = createMediaViewerButton(videoPath, "video", videoLabel);
                expandButton.classList.add("media-viewer-expand");
                expandButton.textContent = "⤢";
                videoItem.append(video, expandButton);
                videoGrid.append(videoItem);
                video.load();
            });

            videoSection.append(videoHeading, videoGrid);
            projectDialogContent.append(videoSection);
        }

        const galleryCategories = [
            { attribute: "prototypeImages", title: "Prototype / brouillon" },
            { attribute: "designImages", title: "Design Figma" },
            { attribute: "resultImages", title: "Résultat final" },
            { attribute: "versionImages", title: "Autres versions" },
            { attribute: "otherImages", title: "Autres images" },
        ];
        const gallery = document.createElement("div");
        gallery.className = "project-dialog-gallery";

        galleryCategories.forEach(({ attribute, title: categoryTitle }) => {
            const imagePaths = (card.dataset[attribute] || "")
                .split("|")
                .map((path) => path.trim())
                .filter(Boolean);

            if (!imagePaths.length) {
                return;
            }

            const category = document.createElement("section");
            category.className = "project-gallery-category";
            const heading = document.createElement("h3");
            heading.textContent = categoryTitle;
            const images = document.createElement("div");
            images.className = "project-gallery-grid";

            imagePaths.forEach((path, index) => {
                const image = document.createElement("img");
                const imageLabel = `${title.textContent.trim()} — ${categoryTitle}, image ${index + 1}`;
                image.src = path;
                image.alt = imageLabel;
                image.loading = "lazy";
                const imageButton = createMediaViewerButton(path, "img", imageLabel);
                imageButton.append(image);
                images.append(imageButton);
            });

            category.append(heading, images);
            gallery.append(category);
        });

        if (gallery.childElementCount) {
            projectDialogContent.append(gallery);
        }

        const links = card.querySelector(".project-links");
        if (links) {
            const availableLinks = [...links.querySelectorAll("a")].filter(
                (link) => link.getAttribute("href")?.trim(),
            );
            if (availableLinks.length) {
                const linksContainer = document.createElement("div");
                linksContainer.className = "project-links";
                availableLinks.forEach((link) => {
                    linksContainer.append(link.cloneNode(true));
                });
                projectDialogContent.append(linksContainer);
            }
        }

        projectDialog.showModal();
        updatePageScrollLock();
    });
});

projectDialogClose.addEventListener("click", () => {
    projectDialog.close();
});

projectDialog.addEventListener("close", () => {
    projectDialogContent.querySelectorAll("video").forEach((video) => video.pause());
    updatePageScrollLock();
});

projectDialogContent.addEventListener("click", (event) => {
    const trigger = event.target.closest(".media-viewer-trigger");
    if (trigger) {
        openMediaViewer(
            trigger.dataset.mediaSrc,
            trigger.dataset.mediaType,
            trigger.getAttribute("aria-label").replace("Agrandir : ", ""),
        );
    }
});

mediaViewerClose.addEventListener("click", () => {
    mediaViewer.close();
});

mediaViewer.addEventListener("close", () => {
    mediaViewerContent.querySelectorAll("video").forEach((video) => video.pause());
    mediaViewerContent.replaceChildren();
    updatePageScrollLock();
});

mediaViewer.addEventListener("click", (event) => {
    if (event.target === mediaViewer) {
        mediaViewer.close();
    }
});

projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) {
        projectDialog.close();
    }
});
