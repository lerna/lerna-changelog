export default function findPullRequestId(message: string): string | null {
  const lines = message.split("\n");
  const firstLine = lines[0];

  if (message.indexOf("Merge pull request ") === 0) {
    const start = message.indexOf("#") + 1;
    const end = message.slice(start).indexOf(" ");
    return message.slice(start, start + end);
  }

  const mergeCommit = firstLine.match(/\(#(\d+)\)$/);
  if (mergeCommit) {
    return mergeCommit[1];
  }

  const homuMatch = firstLine.match(/^Auto merge of #(\d+) - /);
  if (homuMatch) {
    return homuMatch[1];
  }

  return null;
}
