/* -------------------------
  CareerLink — frontend script
  Works with backend at: http://localhost:4000
------------------------- */
console.log("SCRIPT LOADED SUCCESSFULLY");

const API_URL = "http://localhost:4000";
let currentApplyJobId = null;

// ----------------- Utilities -----------------
function $(sel) {
  return document.querySelector(sel);
}
function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

// safe helper to get/create jobs grid
function getJobsGrid() {
  // prefer explicit id if present
  let jobsGrid = document.getElementById("jobs-grid");
  if (jobsGrid) return jobsGrid;
}

// prevent <a href="..."> navigation for nav links if present
$all(".nav-login, .nav-cta").forEach((a) => {
  if (a && a.tagName === "A") a.setAttribute("href", "#");
  a &&
    a.addEventListener("click", (e) => {
      e.preventDefault();
    });
});

// ----------------- Modal open/close handlers -----------------
document.addEventListener("DOMContentLoaded", () => {
  // open login/register modals (your index.html uses these classes)
  const navLogin = document.querySelector(".nav-login");
  const navReg = document.querySelector(".nav-cta");
  if (navLogin)
    navLogin.addEventListener("click", (e) => {
      e.preventDefault();
      $("#login-modal").style.display = "flex";
    });
  if (navReg)
    navReg.addEventListener("click", (e) => {
      e.preventDefault();
      $("#register-modal").style.display = "flex";
    });

  $all(".close-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const target = this.dataset.close;
      if (target) document.getElementById(target).style.display = "none";
    });
  });

  // intercept login form submit (login modal form currently posts to php)
  const loginForm = document.querySelector("#login-modal form");
  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  // register form (index.html had onsubmit attribute, but we also attach here to be safe)
  const regForm = document.querySelector("#register-modal form");
  if (regForm) {
    regForm.addEventListener("submit", registerUser);
  }

  // apply form submit
  const applyForm = document.querySelector("#apply-modal form");
  if (applyForm) {
    applyForm.addEventListener("submit", submitApplication);
  }

  // admin login form (if you keep client-side admin modal)
  const adminLoginForm = document.querySelector("#admin-login-modal form");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // existing behaviour (keeps your simple admin credentials)
      const email = document.getElementById("admin-email").value;
      const password = document.getElementById("admin-password").value;
      const correctEmail = "admin@gmail.com";
      const correctPassword = "1234";
      if (email === correctEmail && password === correctPassword) {
        window.location.href = "admin.html";
      } else {
        alert("Invalid admin credentials!");
      }
    });
  }

  // Attach search button handler here to avoid timing issues
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn)
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      searchJobs();
    });

  // initial load
  loadJobs();
});

// ----------------- Job Search -----------------
async function searchJobs() {
  const inputEl = document.getElementById("search-input");
  const query = inputEl ? inputEl.value.trim() : "";

  if (!query) {
    alert("Enter a job title, company, or location.");
    return;
  }

  const url = `${API_URL}/api/jobs/search?q=${encodeURIComponent(query)}`;
  console.log("Searching jobs:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Search failed (${res.status}): ${txt}`);
    }

    const jobs = await res.json();
    console.log(
      "Search returned",
      Array.isArray(jobs) ? jobs.length : typeof jobs,
      "items"
    );

    // Update job grid
    let jobsGrid = getJobsGrid();
    if (!jobsGrid) {
      alert("Jobs container not found in DOM.");
      return;
    }

    jobsGrid.innerHTML = ""; // Clear previous results

    // NO JOBS FOUND — SHOW MESSAGE + STOP
    if (!Array.isArray(jobs) || jobs.length === 0) {
      jobsGrid.innerHTML = `
        <p style="
          grid-column: 1 / -1;
          text-align: center;
          font-size: 1.6rem;
          margin-top: 2rem;
          color: #555;
        ">❌ No jobs found.</p>
      `;
    }

    //JOBS FOUND — RENDER THEM
    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "job-card";

      card.innerHTML = `
        <h3 class="job-title">${escapeHtml(job.title)}</h3>
        <p class="job-company">${escapeHtml(job.company)}</p>
        <p class="job-location">${escapeHtml(job.location)}</p>
        <p class="job-salary">${escapeHtml(job.salary)}</p>
        <p class="job-desc" style="display:none">${escapeHtml(
          job.description || ""
        )}</p>
        <button class="btn btn--full apply-btn" data-job-id="${
          job.id
        }">Apply Now</button>
      `;

      jobsGrid.appendChild(card);
    });

    // Reattach apply events
    $all(".apply-btn").forEach((btn) =>
      btn.addEventListener("click", () => openApplyModal(btn.dataset.jobId))
    );

    //ONLY SCROLL IF JOBS FOUND
    document.getElementById("section-jobs").scrollIntoView({
      behavior: "smooth",
    });
  } catch (err) {
    console.error("Search error:", err);
    alert("Failed to search jobs: " + err.message);
  }
}

// ----------------- Load jobs from backend -----------------
async function loadJobs() {
  try {
    const res = await fetch(`${API_URL}/api/jobs`);
    if (!res.ok) throw new Error(`Failed to fetch jobs (${res.status})`);
    const jobs = await res.json();

    let jobsGrid = getJobsGrid();
    if (!jobsGrid) {
      console.warn("Jobs grid not available.");
      return;
    }

    // clear existing cards
    jobsGrid.innerHTML = "";

    // create cards from fetched jobs
    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "job-card";

      // safe text (very simple)
      const t = job.title || "";
      const c = job.company || "";
      const loc = job.location || "";
      const sal = job.salary || "";
      const desc = job.description || "";

      card.innerHTML = `
        <h3 class="job-title">${escapeHtml(t)}</h3>
        <p class="job-company">${escapeHtml(c)}</p>
        <p class="job-location">${escapeHtml(loc)}</p>
        <p class="job-salary">${escapeHtml(sal)}</p>
        <p class="job-desc" style="display:none">${escapeHtml(desc)}</p>
        <button class="btn btn--full apply-btn" data-job-id="${
          job.id
        }">Apply Now</button>
      `;
      jobsGrid.appendChild(card);
    });

    // attach apply handler to generated buttons
    $all(".apply-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.jobId;
        openApplyModal(id);
      });
    });
  } catch (err) {
    console.error("loadJobs error:", err);
  }
}

// small helper //chat gpt for security
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ----------------- Apply modal helpers -----------------
function openApplyModal(jobId) {
  currentApplyJobId = jobId;
  const modal = document.getElementById("apply-modal");
  if (modal) modal.style.display = "flex";
}

function closeApplyModal() {
  const modal = document.getElementById("apply-modal");
  if (modal) modal.style.display = "none";
}

// ----------------- Submit application (resume upload) -----------------
async function submitApplication(e) {
  e.preventDefault();

  const nameEl = document.getElementById("applicant-name");
  const emailEl = document.getElementById("applicant-email");
  const resumeEl = document.getElementById("resume");

  if (!currentApplyJobId) {
    alert("No job selected. Please click Apply on a job first.");
    return;
  }
  if (!nameEl || !emailEl || !resumeEl) {
    alert("Application form is missing fields.");
    return;
  }

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const file = resumeEl.files[0];

  if (!name || !email || !file) {
    alert("Please fill all fields and attach your resume.");
    return;
  }

  const fd = new FormData();
  fd.append("job_id", currentApplyJobId);
  fd.append("name", name);
  fd.append("email", email);
  fd.append("resume", file);

  try {
    const res = await fetch(`${API_URL}/api/apply`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Apply failed");

    alert(data.message || "Application submitted");
    // reset form
    nameEl.value = "";
    emailEl.value = "";
    resumeEl.value = "";
    closeApplyModal();
  } catch (err) {
    console.error("apply error", err);
    alert("Failed to submit application: " + (err.message || err));
  }
}

// ----------------- Register -----------------
async function registerUser(e) {
  if (e) e.preventDefault();

  const name = (document.getElementById("reg-name") || {}).value || "";
  const email = (document.getElementById("reg-email") || {}).value || "";
  const password = (document.getElementById("reg-password") || {}).value || "";

  if (!name || !email || !password) {
    alert("Please fill all registration fields.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Register failed");

    alert(data.message || "Registered successfully");
    // close modal if present
    const m = document.getElementById("register-modal");
    if (m) m.style.display = "none";
  } catch (err) {
    console.error("register error", err);
    alert("Register failed: " + (err.message || err));
  }
}

// ----------------- Login -----------------
async function loginUser(e) {
  if (e) e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    alert(data.message);

    // Save data
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    //  Redirect based on role
    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html"; // <-- your normal user dashboard
    }
  } catch (err) {
    alert(err.message);
  }
}

// ----------------- ADMIN: load all users into admin table -----------------
async function loadAdminUsers() {
  const table = document.getElementById("userTable");
  if (!table) return; // not on admin page

  try {
    const res = await fetch(`${API_URL}/api/auth/users`);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch users (${res.status}): ${txt}`);
    }
    const users = await res.json();

    table.innerHTML = ""; // clear previous rows

    users.forEach((user) => {
      const row = document.createElement("tr");
      row.dataset.userId = user.id;

      row.innerHTML = `
        <td>${user.id}</td>
        <td>${escapeHtml(user.email || "")}</td>
        <td>${escapeHtml(user.role || "User")}</td>
        <td>
          <button class="btn btn-danger" onclick="deleteUser(this)">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
  } catch (err) {
    console.error("Admin users load error:", err);
  }
}

// ----------------- ADMIN: delete user -----------------
async function deleteUser(btn) {
  const row = btn.closest("tr");
  const id = row && row.dataset && row.dataset.userId;

  // fallback prompt if id missing
  let userId = id;
  if (!userId) {
    userId = prompt("Enter user id to delete:");
    if (!userId) return;
  }

  if (!confirm("Delete user id " + userId + "? This action is permanent.")) {
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/api/auth/users/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.message || `Delete failed (${res.status})`);

    alert(data.message || "User deleted");
    // remove row from DOM
    if (row) row.remove();
    // refresh table
    loadAdminUsers();
  } catch (err) {
    console.error("deleteUser error:", err);
    alert("Delete failed: " + (err.message || err));
  }
}

// Ensure admin user list loads when admin page opens
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("userTable")) {
    loadAdminUsers();
  }
});

// ----------------- ADMIN: add a job (simple prompts) -----------------
async function addJob() {
  // collect job info via prompt (your admin page did not include a detailed form)
  const title = prompt("Job Title:");
  if (!title) return alert("Cancelled");

  const company = prompt("Company name:") || "";
  const location = prompt("Location:") || "";
  const salary = prompt("Salary:") || "";
  const description = prompt("Description:") || "";

  try {
    const res = await fetch(`${API_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, company, location, salary, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Add job failed");

    alert(data.message || "Job added");
    // reload jobs on homepage
    loadJobs();
    loadAdminJobs();
  } catch (err) {
    console.error("addJob error", err);
    alert("Failed to add job: " + (err.message || err));
  }
}

// ----------------- Optional helper: delete job (called from admin table rows) -----------------
async function deleteJob(btn) {
  const row = btn.closest("tr");
  let id = row && row.dataset && row.dataset.jobId;
  if (!id) {
    id = prompt("Enter job id to delete:");
    if (!id) return;
  }
  if (!confirm("Delete job id " + id + "?")) return;

  try {
    const res = await fetch(`${API_URL}/api/jobs/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Delete failed");
    alert(data.message || "Deleted");

    if (row) row.remove();

    loadJobs();
  } catch (err) {
    console.error("delete error", err);
    alert("Delete failed: " + (err.message || err));
  }
}
// ----------------- ADMIN: load all jobs into admin table -----------------
async function loadAdminJobs() {
  const table = document.getElementById("jobTable");
  if (!table) return;

  try {
    const res = await fetch(`${API_URL}/api/jobs`);
    const jobs = await res.json();

    table.innerHTML = "";

    jobs.forEach((job) => {
      const row = document.createElement("tr");
      row.dataset.jobId = job.id;

      row.innerHTML = `
        <td>${job.id}</td>
        <td>${escapeHtml(job.title)}</td>
        <td>${escapeHtml(job.company)}</td>
        <td>
          <button class="btn btn-danger" onclick="deleteJob(this)">Delete</button>
        </td>
      `;

      table.appendChild(row);
    });
  } catch (err) {
    console.error("Admin table load error:", err);
  }
}

// If on admin page, load jobs automatically
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("jobTable")) {
    loadAdminJobs();
  }
});


// ----------------- contact form -----------------
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");
  const contactStatus = document.getElementById("contact-status");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("contact-email").value.trim();
      const message = document.getElementById("contact-message").value.trim();

      if (!email || !message) {
        contactStatus.textContent = "Please fill in all fields.";
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, message }),
        });

        const data = await res.json();

        if (res.ok) {
          contactStatus.textContent = "Message sent successfully!";
          contactForm.reset();
        } else {
          contactStatus.textContent = data.error || "Failed to send message.";
        }
      } catch (err) {
        console.error(err);
        contactStatus.textContent = "Server error. Try again later.";
      }
    });
  }
});
