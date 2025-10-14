# Background Jobs System - Setup & Deployment Guide

## 🎯 Overview

CodeForge AI now supports background job processing, allowing users to submit long-running tasks (like code generation, repository analysis) that run independently while the chat interface remains responsive.

## 🏗️ Architecture

```
Frontend                  Backend (Web Dyno)           Redis Queue              Workers (Worker Dynos)
   │                             │                          │                            │
   │  POST /api/jobs/agent-task  │                          │                            │
   │ ──────────────────────────> │  Add job to queue        │                            │
   │                             │ ──────────────────────> │                            │
   │  { jobId, status: queued }  │                          │                            │
   │ <────────────────────────── │                          │                            │
   │                             │                          │  Process job               │
   │                             │                          │ <───────────────────────── │
   │                             │                          │                            │
   │  Socket.IO: job updates     │                          │  Emit progress updates     │
   │ <──────────────────────────────────────────────────────────────────────────────────│
   │                             │                          │                            │
   │  GET /api/jobs/:jobId       │                          │                            │
   │ ──────────────────────────> │  Get job status          │                            │
   │  { job details, result }    │ ──────────────────────> │                            │
   │ <────────────────────────── │ <─────────────────────── │                            │
```

## 📦 Components

### 1. **Queue Manager** (`backend/src/jobs/QueueManager.ts`)
- Manages Bull queues for different job types
- Handles job lifecycle (add, get, cancel, retry)
- Connects to Redis for persistent storage

### 2. **Job Processor** (`backend/src/jobs/processors/AgentTaskProcessor.ts`)
- Processes agent tasks in background
- Routes to appropriate agents/workflows
- Emits real-time progress updates via Socket.IO

### 3. **Worker Process** (`backend/src/jobs/worker.ts`)
- Separate process that consumes jobs from queue
- Can be scaled independently (multiple workers)
- Handles graceful shutdown

### 4. **API Endpoints** (`backend/src/api/routes/jobs.ts`)
- `POST /api/jobs/agent-task` - Submit new job
- `GET /api/jobs/:jobId` - Get job status
- `GET /api/jobs/user/:userId` - List user's jobs
- `DELETE /api/jobs/:jobId` - Cancel job
- `POST /api/jobs/:jobId/retry` - Retry failed job
- `GET /api/jobs/stats/queue` - Queue statistics

### 5. **Frontend Panel** (`frontend/src/components/BackgroundJobsPanel.tsx`)
- Floating panel showing active jobs
- Real-time progress updates
- Cancel/retry functionality

## 🚀 Heroku Deployment

### Step 1: Add Redis Add-on

```bash
# Add Heroku Redis (free tier available)
heroku addons:create heroku-redis:mini -a your-app-name

# Verify Redis URL is set
heroku config:get REDIS_URL -a your-app-name
```

### Step 2: Scale Worker Dynos

```bash
# Scale up worker dynos (adjust based on load)
heroku ps:scale worker=2 -a your-app-name

# Check dyno status
heroku ps -a your-app-name
```

Expected output:
```
=== web (Eco): npm start (1)
web.1: up 2024/01/01 12:00:00 +0000 (~ 1h ago)

=== worker: tsx src/jobs/worker.ts (2)
worker.1: up 2024/01/01 12:00:00 +0000 (~ 1h ago)
worker.2: up 2024/01/01 12:00:00 +0000 (~ 1h ago)
```

### Step 3: Monitor Jobs

```bash
# View worker logs
heroku logs --tail --ps worker -a your-app-name

# View all logs
heroku logs --tail -a your-app-name
```

## 💰 Cost Estimation (Heroku)

With $300 credits:

| Resource | Type | Cost/Month | Recommended |
|----------|------|------------|-------------|
| Web Dyno | Eco | $5 | 1 dyno |
| Worker Dynos | Eco | $5 each | 2-5 dynos |
| Redis | Mini | $3 | 1 instance |
| **Total** | | **$18-$33** | |

**Remaining credits**: $267-$282 for scaling up during high load

### Scaling Strategy:

1. **Low Load (Dev/Testing)**
   - 1 web dyno
   - 1 worker dyno
   - Cost: ~$13/month

2. **Medium Load (Production)**
   - 1 web dyno
   - 2-3 worker dynos
   - Cost: ~$18-$23/month

3. **High Load (Scale Up)**
   - 2 web dynos (load balancing)
   - 5-10 worker dynos
   - Redis Premium tier
   - Cost: ~$60-$100/month

## 🔧 Usage Examples

### Frontend: Enable Background Mode

**Option 1: Via Chat Interface (Easiest)**

1. Open the chat interface at `/terminal`
2. Type your message (e.g., "Update my readme to Vietnamese version in versace-landing repo")
3. ✅ **Check the "🔧 Background" checkbox** before sending
4. Click Send (►)
5. You'll see: "Your request is being processed in the background. You can continue chatting!"
6. Click "Background Jobs" button in the left sidebar to view progress

**Option 2: Direct API Call**

```typescript
// Frontend code
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    generationId: 'your-session-id',
    message: 'Update my readme to Vietnamese version',
    backgroundMode: true,  // 🔧 Enable background processing
    githubContext: {
      token: 'ghp_xxx',
      username: 'zaikaman'
    }
  })
});

const data = await response.json();
// Response:
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "status": "queued",
    "backgroundMode": true,
    "message": "Your request is being processed in the background. You can continue chatting!"
  }
}
```

### Backend: Submit Background Job

```typescript
// In chat route with backgroundMode flag
POST /api/chat
{
  "generationId": "gen-123",
  "message": "Update my readme to Vietnamese version in versace-landing repo",
  "backgroundMode": true,  // Enable background processing
  "githubContext": {
    "token": "ghp_xxx",
    "username": "zaikaman"
  }
}

Response:
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "status": "queued",
    "backgroundMode": true,
    "message": "Your request is being processed in the background. You can continue chatting!"
  }
}
```

### Frontend: Track Job Status

```typescript
// Component automatically connects to Socket.IO
// Updates received in real-time:

{
  "jobId": "job-456",
  "status": "active",
  "progress": 65,
  "logs": [
    "[12:00:01] Starting agent task",
    "[12:00:05] Analyzing request and routing to agent...",
    "[12:00:10] Routed to workflow: enhance",
    "[12:00:15] Executing enhance workflow...",
    "[12:00:30] Cloning repository...",
    "[12:00:45] Processing files..."
  ]
}
```

## 🎨 User Experience

### Before Background Jobs:
```
User: "Update my readme to Vietnamese"
[Loading... user waits 2-3 minutes]
[Cannot send new messages]
Response: "Done! Here's your updated README..."
```

### With Background Jobs:
```
User: "Update my readme to Vietnamese"
Bot: "Your request is being processed in the background. Anything else?"
[Background panel shows: ⚙️ Updating readme... 45%]
User: "Also fix the typo in homepage"
Bot: "Sure! I'll fix that typo..."
[Background panel now shows 2 jobs]
[Jobs complete independently]
```

## 🔍 Monitoring & Debugging

### Check Queue Stats

```bash
curl https://your-app.herokuapp.com/api/jobs/stats/queue?type=agent_task
```

Response:
```json
{
  "success": true,
  "stats": {
    "waiting": 3,
    "active": 2,
    "completed": 127,
    "failed": 5,
    "delayed": 0,
    "total": 137
  }
}
```

### View Job Details

```bash
curl https://your-app.herokuapp.com/api/jobs/JOB_ID?type=agent_task
```

### Enable Monitoring (Optional)

Set environment variable:
```bash
heroku config:set ENABLE_QUEUE_MONITORING=true -a your-app-name
```

This logs queue stats every minute in worker logs.

## 🐛 Troubleshooting

### Issue: Workers not processing jobs

**Check:**
1. Workers are running: `heroku ps -a your-app-name`
2. Redis is connected: `heroku config:get REDIS_URL`
3. View worker logs: `heroku logs --ps worker --tail`

**Solution:**
```bash
# Restart workers
heroku ps:restart worker -a your-app-name
```

### Issue: Jobs stuck in "waiting" state

**Check:**
- Worker concurrency setting
- Redis connection issues

**Solution:**
```bash
# Increase worker concurrency
heroku config:set WORKER_CONCURRENCY=5 -a your-app-name

# Restart workers
heroku ps:restart worker
```

### Issue: Memory issues on workers

**Check:**
```bash
heroku logs --ps worker --tail | grep "Memory"
```

**Solution:**
- Reduce concurrency (process fewer jobs simultaneously)
- Upgrade to higher tier dynos
- Add more workers instead of increasing concurrency

## 🎯 Best Practices

1. **Job Retry Logic**
   - Jobs automatically retry 3 times with exponential backoff
   - Adjust in `QueueManager.ts` if needed

2. **Job Cleanup**
   - Completed jobs kept for 24 hours
   - Failed jobs kept for 7 days
   - Automatic cleanup runs daily

3. **Concurrency**
   - Start with 2 concurrent jobs per worker
   - Monitor memory usage
   - Scale workers instead of increasing concurrency

4. **Socket.IO Rooms**
   - Users join `user:${userId}` room for job updates
   - Sessions join `session:${sessionId}` room
   - Both receive updates for flexibility

## 📈 Performance Tips

1. **Redis Optimization**
   - Use Redis Premium for high-traffic apps
   - Enable persistence for job recovery

2. **Worker Scaling**
   - Monitor queue length
   - Auto-scale based on waiting jobs (future: use Heroku autoscaling)

3. **Job Batching**
   - Group similar operations when possible
   - Reduce redundant API calls

## 🔐 Security Notes

1. **Job Ownership**
   - Jobs include `userId` for access control
   - API validates ownership before showing results

2. **Rate Limiting**
   - Apply rate limits to job submission endpoint
   - Prevent queue flooding

3. **Redis Security**
   - Heroku Redis includes TLS by default
   - Connection uses authentication

## 📚 Additional Resources

- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Heroku Redis](https://devcenter.heroku.com/articles/heroku-redis)
- [Socket.IO Rooms](https://socket.io/docs/v4/rooms/)

## ✅ Deployment Checklist

- [ ] Redis add-on provisioned
- [ ] REDIS_URL environment variable set
- [ ] Procfile includes worker process
- [ ] Worker dynos scaled (at least 1)
- [ ] Frontend connects to Socket.IO
- [ ] BackgroundJobsPanel added to UI
- [ ] Test job submission
- [ ] Monitor worker logs
- [ ] Set up alerting for failed jobs

---

**Ready to deploy?** 🚀

```bash
# Deploy to Heroku
git push heroku main

# Scale workers
heroku ps:scale worker=2

# Monitor
heroku logs --tail
```
