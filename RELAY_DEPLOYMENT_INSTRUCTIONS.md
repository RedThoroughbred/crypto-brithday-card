# Relay Service Deployment Instructions

## 1. Copy the setup script to your droplet

From your local machine, run:
```bash
scp setup-relay-droplet.sh root@147.182.130.29:/tmp/
```

## 2. SSH into your droplet and run the setup script

```bash
ssh root@147.182.130.29
cd /tmp
chmod +x setup-relay-droplet.sh
./setup-relay-droplet.sh
```

## 3. Test the relay service

After setup, test that it's working:
```bash
# From inside the droplet
curl https://localhost:3001/health

# Check PM2 status
pm2 status geogift-relay
pm2 logs geogift-relay
```

## 4. Update Vercel Environment Variables

Go to your Vercel dashboard:
1. Navigate to your project settings
2. Go to Environment Variables
3. Add this new variable:
   - Key: `NEXT_PUBLIC_RELAY_SERVICE_URL`
   - Value: `https://147.182.130.29/relay`
   - Environment: Production, Preview, Development

## 5. Update Nginx to proxy relay requests through /relay path

The script creates a separate server block, but we need to add it to the main server block. 
On the droplet, edit the main Nginx config:

```bash
nano /etc/nginx/sites-available/geogift
```

Add this location block inside the existing server block (after the /api location):

```nginx
    location /relay/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

Then reload Nginx:
```bash
nginx -t
systemctl reload nginx
```

## 6. Final Testing

Test the relay service through the proxy:
```bash
# From your local machine
curl https://147.182.130.29/relay/health
```

## Troubleshooting

If you encounter issues:

1. Check PM2 logs: `pm2 logs geogift-relay`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Ensure the relay wallet has ETH for gas fees
4. Verify the contract addresses are correct

## Security Note

The relay wallet private key is currently hardcoded. For production:
1. Use environment variables
2. Store the key securely (e.g., in a secrets manager)
3. Rotate keys regularly
4. Monitor the relay wallet balance