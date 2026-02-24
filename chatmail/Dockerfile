FROM debian:bookworm

RUN apt-get update && apt-get install -y \
    systemd systemd-sysv dbus \
    openssh-server \
    python3 python3-dev python3-venv git curl cron socat \
    build-essential libcrypt-dev libc-dev \
    vim \
    && apt-get clean

WORKDIR /opt/chatmail

RUN git clone https://github.com/chatmail/relay.git . \
    && ./scripts/initenv.sh

RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh \
    && ssh-keygen -t ed25519 -N "" -f /root/.ssh/id_ed25519 -C "chatmail-root" \
    && cat /root/.ssh/id_ed25519.pub >> /root/.ssh/authorized_keys \
    && chmod 600 /root/.ssh/authorized_keys \
    && printf "Host localhost 127.0.0.1 ::1\n  StrictHostKeyChecking no\n  UserKnownHostsFile /dev/null\n  LogLevel ERROR\n" > /root/.ssh/config \
    && chmod 600 /root/.ssh/config

RUN systemctl enable ssh
RUN systemctl enable cron

EXPOSE 25 80 143 443 465 587 993 3340 3478

CMD ["/sbin/init"]
