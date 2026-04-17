echo "Using Cloudflare tunnel URL: http://localhost:3000"
echo ""
echo ""
echo "=================================================="
echo "Go to https://www.creem.io/dashboard/developers/webhooks setup the webhook URL"
echo "=================================================="
echo ""
echo ""

cloudflared tunnel --url http://localhost:3000
