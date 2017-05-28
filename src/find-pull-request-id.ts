export default function findPullRequestId(message: string): string | null {
  if (message.indexOf("Merge pull request ") === 0) {
    const start = message.indexOf("#") + 1;
    const end = message.slice(start).indexOf(" ");
    return message.slice(start, start + end);
  }

  const mergeCommit = message.match(/\(#(\d+)\)$/);
  if (mergeCommit) {
    return mergeCommit[1];
  }

  return null;
}
