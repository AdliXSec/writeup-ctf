FROM ruby:2.7-slim

RUN apt-get update -qq && \
    apt-get install -y build-essential libsqlite3-dev nodejs texlive-latex-base texlive-latex-extra && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN echo "LEEXY{papermaker_yaml_deserialization_rce_90192}" > /flag.txt

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY . .
RUN mkdir -p tmp/pids

ENV RUBYOPT="-rlogger"
RUN bundle exec rake db:migrate

ENV PORT=8130
EXPOSE 8130

CMD ["bundle", "exec", "rackup", "--host", "0.0.0.0", "-p", "8130"]

RUN rm -f /flag.txt && ln -s /tmp/flag.txt /flag.txt
