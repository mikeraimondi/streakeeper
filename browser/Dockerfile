FROM phusion/baseimage:0.9.21

RUN apt-get update && apt-get install -y chromium-browser

EXPOSE 9222
CMD ["chromium-browser", "--headless", "--remote-debugging-address=0.0.0.0", "--remote-debugging-port=9222", "--disable-gpu", "--no-sandbox"]
