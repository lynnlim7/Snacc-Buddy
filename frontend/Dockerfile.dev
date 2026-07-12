FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 8081

# Metro advertises this IP in the QR code / connection URL so the device can reach it.
# Override at runtime: REACT_NATIVE_PACKAGER_HOSTNAME=<your-lan-ip>
ENV REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.12
ENV EXPO_PUBLIC_API_URL=http://192.168.1.12:8000

CMD ["npx", "expo", "start", "--host", "lan"]
