public class ChatThread implements Runnable {
    private final UniversityStudent sender;
    private final UniversityStudent receiver;
    private final String message;


    public ChatThread(UniversityStudent sender, UniversityStudent receiver, String message) {
        // Constructor
        this.sender = sender;
        this.receiver = receiver;
        this.message = message;
    }

    @Override
    public void run() {
        UniversityStudent first;
        UniversityStudent second;

        // determine the locking order alphabetically by student name
        if (sender.name.compareTo(receiver.name) < 0) {
            first = sender;
            second = receiver;
        } else {
            first = receiver;
            second = sender;
        }

        synchronized (first) {
            synchronized (second) {
                // buuild messgae string
                String formatted = "[" + sender.name + " -> " + receiver.name + "]: " + message;

                // both students get message history
                sender.addMessage(receiver.name, formatted);
                receiver.addMessage(sender.name, formatted);

                // output to console
                System.out.println(formatted + " [Thread: " + Thread.currentThread().getName() + "]");
            }
        }
    }
}
