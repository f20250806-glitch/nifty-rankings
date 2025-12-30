# Step-by-Step Deployment Guide

This guide will help you put your "S&P 500 Ranking App" on the internet so anyone can see it. We will use **GitHub** to store your code and **Vercel** to host the website for free.

---

## Part 1: Prepare Your Code (Upload to GitHub)

First, we need to move your code from your computer to GitHub.

1.  **Create a GitHub Account**: If you don't have one, go to [github.com](https://github.com) and sign up.
2.  **Create a New Repository**:
    *   Click the **+** icon in the top right corner and select **New repository**.
    *   Name it `sp500-ranker`.
    *   Initialize with nothing (uncheck "Add a README file").
    *   Click **Create repository**.
3.  **Upload Your Code**:
    Open your terminal/command prompt in the `starterfiles` folder and run these commands one by one:

    ```bash
    # 1. Initialize Git
    git init

    # 2. Add all your files
    git add .

    # 3. Commit the files (save them)
    git commit -m "First upload of my app"

    # 4. Connect to your new GitHub repo (Replace URL with YOUR repository link)
    git remote add origin https://github.com/YOUR_USERNAME/sp500-ranker.git

    # 5. Push the code to the internet
    git push -u origin main
    ```

---

## Part 2: Publish the Website (Vercel)

Now that your code is on GitHub, we will use Vercel to build the website (the React frontend).

1.  **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign up (continue with GitHub).
2.  **Add New Project**:
    *   Click **"Add New..."** -> **"Project"**.
    *   You will see your `sp500-ranker` repository listed. Click **Import**.
3.  **Configure the Project** (Crucial Step):
    *   **Framework Preset**: It should auto-detect "Vite".
    *   **Root Directory**: Click "Edit" and select the `webapp` folder. (Because your React app lives inside the `webapp` folder, not the root).
4.  **Deploy**:
    *   Click **Deploy**.
    *   Wait about a minute. Vercel will install dependencies and build your site.
5.  **View Your Site**:
    *   Once done, you will get a link like `https://sp500-ranker.vercel.app`. Your site is now online!

---

## Part 3: Automate Daily Updates (Optional)

Right now, your site shows the rankings from the day you uploaded the code. Since stock prices change, you want this to update automatically.

I have already added a special file to your project (`.github/workflows/daily-update.yml`).

*   **What it does**: Every day at roughly 10:00 AM UTC, GitHub will automatically wake up, run your `fetch_data.py` script to get new prices, and update the `data.json` file.
*   **Automatic Redeploy**: When GitHub updates the data file, Vercel will notice the change and automatically update your live website.

**You don't need to do anything for this!** It is already set up in the code you pushed in Part 1.

---

## Troubleshooting

*   **"Build Failed" on Vercel**: ensure you selected `webapp` as the Root Directory in Step 2.
*   **Rankings not updating**: Check the "Actions" tab in your GitHub repository to see if the "Update Rankings" job ran successfully.
